"""
FastAPI REST API Endpoints
--------------------------
Handles audio spoof detection, microphone recordings, historical analyses,
model telemetry, and evaluation metrics.
"""

import os
import json
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, delete

from backend.app.config import settings
from backend.app.database.session import get_db
from backend.app.database.models import AnalysisRecord
from backend.app.services.model_service import model_service
from backend.app.schemas.detection import (
    DetectionResponse,
    HistoryListResponse,
    HistoryItemSchema,
    HealthResponse,
    ModelInfoResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Audio Forensics"])


@router.post(
    "/detect",
    response_model=DetectionResponse,
    summary="Analyze uploaded audio file for synthetic voice artifacts",
)
async def detect_audio(
    file: UploadFile = File(..., description="Audio file in WAV, MP3, FLAC, OGG, or M4A format"),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts an uploaded audio file, verifies acoustic format, extracts Log-Mel features,
    and returns model classification (BONAFIDE vs SPOOF) with confidence and forensic metrics.
    """
    return await model_service.analyze_and_record(file=file, db=db, is_mic_recording=False)


@router.post(
    "/record",
    response_model=DetectionResponse,
    summary="Analyze live microphone recording stream",
)
async def record_audio(
    file: UploadFile = File(..., description="Audio recording blob from frontend microphone"),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives live microphone audio recorded directly in the web dashboard,
    validates format, and returns real-time spoof assessment.
    """
    return await model_service.analyze_and_record(file=file, db=db, is_mic_recording=True)


@router.get(
    "/history",
    response_model=HistoryListResponse,
    summary="Retrieve paginated analysis history with search and filter",
)
async def get_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    prediction: Optional[str] = Query(None, description="Filter by 'BONAFIDE' or 'SPOOF'"),
    search: Optional[str] = Query(None, description="Search by file name"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches stored analysis records from the database with optional keyword search
    and class filtering.
    """
    query = select(AnalysisRecord)

    if prediction and prediction.upper() in ["BONAFIDE", "SPOOF"]:
        query = query.where(AnalysisRecord.prediction == prediction.upper())

    if search:
        query = query.where(AnalysisRecord.file_name.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one_or_none() or 0

    # Pagination & sorting
    offset = (page - 1) * limit
    query = query.order_by(desc(AnalysisRecord.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()

    items = []
    for r in records:
        items.append(
            HistoryItemSchema(
                id=r.id,
                file_name=r.file_name,
                file_format=r.file_format,
                file_size_bytes=r.file_size_bytes,
                duration_seconds=r.duration_seconds,
                prediction=r.prediction,
                confidence=r.confidence,
                probabilities={"bonafide": r.bonafide_prob, "spoof": r.spoof_prob},
                analysis_time_ms=r.analysis_time_ms,
                explanation=r.explanation,
                status=r.status,
                created_at=r.created_at.isoformat() if r.created_at else None,
            )
        )

    return HistoryListResponse(items=items, total=total, page=page, limit=limit)


@router.get(
    "/history/{record_id}",
    summary="Retrieve full detail of a specific analysis record",
)
async def get_history_detail(record_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves full spectrogram previews, acoustic metadata, and segment details for a past analysis."""
    result = await db.execute(select(AnalysisRecord).where(AnalysisRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Record {record_id} not found.")
    return record.to_dict()


@router.delete(
    "/history/{record_id}",
    summary="Delete an analysis record from history",
)
async def delete_history(record_id: int, db: AsyncSession = Depends(get_db)):
    """Deletes an analysis record and frees associated storage."""
    result = await db.execute(select(AnalysisRecord).where(AnalysisRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Record {record_id} not found.")

    await db.execute(delete(AnalysisRecord).where(AnalysisRecord.id == record_id))
    await db.commit()
    return {"message": f"Record {record_id} successfully deleted.", "deleted_id": record_id}


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check and model readiness telemetry",
)
async def health_check():
    """Returns application health, version, compute device, and model readiness status."""
    predictor = model_service.predictor
    is_ready = predictor is not None and predictor.is_trained
    model_name = predictor.model_config.get("model_architecture", "AudioCNNBiLSTM") if predictor else "Unknown"
    device = str(predictor.device) if predictor else "cpu"

    return HealthResponse(
        status="healthy" if is_ready else "degraded",
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        model_loaded=is_ready,
        model_name=model_name,
        device=device,
    )


@router.get(
    "/model-info",
    summary="Detailed deep learning model architecture and specifications",
)
async def get_model_info():
    """Returns the neural network layers, input dimensions, and attention specifications."""
    predictor = model_service.predictor
    if not predictor:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model service not ready.")

    cfg = predictor.model_config
    return {
        "model_architecture": cfg.get("model_architecture", "AudioCNNBiLSTM"),
        "is_trained": predictor.is_trained,
        "classes": cfg.get("classes", ["BONAFIDE", "SPOOF"]),
        "input_dimensions": {
            "channels": cfg.get("in_channels", 1),
            "n_mels": cfg.get("n_mels", 80),
            "target_duration_sec": 3.0,
            "target_samples": 48000,
            "sampling_rate": 16000,
        },
        "cnn_backbone": "4-Stage 2D Convolution with BatchNorm, ReLU, Dropout, and Frequency Pooling",
        "temporal_backbone": "2-Layer Bidirectional LSTM (256 hidden features)",
        "attention_layer": "Learned Self-Attention Temporal Pooling",
        "device": str(predictor.device),
        "weights_path": settings.MODEL_WEIGHTS_PATH,
    }


@router.get(
    "/metrics",
    summary="Trained model performance evaluation metrics and curves",
)
async def get_metrics():
    """Returns the verified test evaluation metrics, confusion matrix, and training history."""
    if not os.path.exists(settings.METRICS_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation metrics not found. Run model training and evaluation first.",
        )

    with open(settings.METRICS_PATH, "r") as f:
        metrics_data = json.load(f)

    return metrics_data


@router.get(
    "/audio/{record_id}",
    summary="Retrieve audio stream if stored",
)
async def get_audio_stream(record_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves an audio stream for playback if storage is enabled in configuration."""
    if not settings.STORE_UPLOADED_AUDIO:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"message": "Audio file retention is disabled to protect user privacy."},
        )

    result = await db.execute(select(AnalysisRecord).where(AnalysisRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio record not found.")

    audio_path = os.path.join(settings.UPLOAD_TEMP_DIR, f"{record.id}_{record.file_name}")
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not on disk.")

    return FileResponse(audio_path, media_type="audio/wav", filename=record.file_name)
