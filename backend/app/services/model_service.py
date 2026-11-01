"""
Model Inference and Audio Verification Service
----------------------------------------------
Coordinates audio validation, temporary file safety, deep learning inference,
and database persistence.
"""

import os
import io
import json
import logging
from typing import Dict, Any, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import settings
from backend.deep_learning.predict import SpoofPredictor
from backend.app.database.models import AnalysisRecord

logger = logging.getLogger(__name__)


class ModelService:
    """Manages model lifecycle and audio request execution."""

    def __init__(self):
        self.predictor: Optional[SpoofPredictor] = None

    def initialize(self) -> None:
        """Loads model into memory during server startup."""
        logger.info("Initializing SpoofPredictor...")
        self.predictor = SpoofPredictor(
            weights_path=settings.MODEL_WEIGHTS_PATH,
            config_path=settings.MODEL_CONFIG_PATH,
            preproc_config_path=settings.PREPROCESSING_CONFIG_PATH,
        )
        logger.info(
            f"SpoofPredictor ready. Model: {self.predictor.model_config.get('model_architecture', 'AudioCNNBiLSTM')}, "
            f"Trained: {self.predictor.is_trained}, Device: {self.predictor.device}"
        )

    def validate_audio_file(self, file: UploadFile, content: bytes) -> str:
        """Validates extension, size, and header readability."""
        if not content or len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes). Please upload a valid audio recording.",
            )

        # Max size check
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
            )

        # Extension check
        filename = file.filename or "recording.wav"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in settings.allowed_extensions_set:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported audio format '{ext}'. Supported formats: {', '.join(settings.allowed_extensions_set)}",
            )

        return ext.lstrip(".")

    async def analyze_and_record(
        self,
        file: UploadFile,
        db: AsyncSession,
        is_mic_recording: bool = False,
    ) -> Dict[str, Any]:
        """
        Runs complete deep learning inference on uploaded/recorded audio,
        saves results to the database, and returns formatted prediction.
        """
        if self.predictor is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model service is currently initializing or unavailable.",
            )

        content = await file.read()
        file_format = self.validate_audio_file(file, content)
        filename = file.filename or ("mic_recording.wav" if is_mic_recording else "uploaded_audio.wav")

        try:
            # Perform inference directly on bytes
            result = self.predictor.predict(content, detailed_segments=True)
        except Exception as e:
            logger.error(f"Inference error for {filename}: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Audio decoding or inference failed: {str(e)}. Please ensure the file is a valid, uncorrupted audio stream.",
            )

        meta = result["audio_metadata"]
        probs = result["probabilities"]

        # Persist to database
        record = AnalysisRecord(
            file_name=filename,
            file_format=file_format,
            file_size_bytes=len(content),
            duration_seconds=meta["duration"],
            sample_rate=meta["sample_rate"],
            prediction=result["prediction"],
            confidence=result["confidence"],
            bonafide_prob=probs["bonafide"],
            spoof_prob=probs["spoof"],
            analysis_time_ms=result["analysis_time_ms"],
            explanation=result["explanation"],
            spectral_centroid_hz=meta.get("spectral_centroid_hz"),
            zero_crossing_rate=meta.get("zero_crossing_rate"),
            rms_energy=meta.get("rms_energy"),
            model_version=result["model_info"]["model_name"],
            status="completed",
            spectrogram_preview=json.dumps(result["visualizations"]["mel_spectrogram_preview"]),
            mfcc_preview=json.dumps(result["visualizations"]["mfcc_preview"]),
            segment_results=json.dumps(result["segment_predictions"]),
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)

        result["id"] = record.id
        result["file_name"] = filename

        return result


model_service = ModelService()
