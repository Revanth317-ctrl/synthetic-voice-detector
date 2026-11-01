"""
Pydantic Schemas for Request & Response Validation
--------------------------------------------------
Strict schema definitions for predictions, audio metadata, model telemetry,
and historical analysis records.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AudioMetadataSchema(BaseModel):
    duration: float = Field(..., description="Audio duration in seconds")
    sample_rate: int = Field(..., description="Sampling rate in Hz")
    channels: int = Field(default=1, description="Number of audio channels")
    num_samples: Optional[int] = Field(default=None, description="Total audio samples")
    rms_energy: Optional[float] = Field(default=None, description="Root-mean-square energy")
    zero_crossing_rate: Optional[int] = Field(default=None, description="Zero-crossing count")
    spectral_centroid_hz: Optional[float] = Field(default=None, description="Spectral centroid in Hz")
    segment_count: Optional[int] = Field(default=1, description="Number of analyzed temporal windows")


class ProbabilitiesSchema(BaseModel):
    bonafide: float = Field(..., description="Probability of genuine human speech (0.0 to 1.0)")
    spoof: float = Field(..., description="Probability of synthetic/spoof speech (0.0 to 1.0)")


class SegmentPredictionSchema(BaseModel):
    segment_index: int
    start_sec: float
    end_sec: float
    prediction: str
    bonafide_prob: float
    spoof_prob: float
    confidence: float


class ModelInfoSummary(BaseModel):
    model_name: str
    is_trained: bool
    device: str


class VisualizationsSchema(BaseModel):
    mel_spectrogram_preview: Optional[List[List[float]]] = None
    mfcc_preview: Optional[List[List[float]]] = None


class DetectionResponse(BaseModel):
    id: Optional[int] = None
    file_name: Optional[str] = None
    prediction: str = Field(..., description="'BONAFIDE' or 'SPOOF'")
    confidence: float = Field(..., description="Confidence score of predicted class (0.0 to 1.0)")
    probabilities: ProbabilitiesSchema
    audio_metadata: AudioMetadataSchema
    analysis_time_ms: float
    explanation: str
    model_info: ModelInfoSummary
    attention_weights: Optional[List[float]] = None
    segment_predictions: Optional[List[SegmentPredictionSchema]] = None
    visualizations: Optional[VisualizationsSchema] = None
    disclaimer: str


class HistoryItemSchema(BaseModel):
    id: int
    file_name: str
    file_format: str
    file_size_bytes: int
    duration_seconds: float
    prediction: str
    confidence: float
    probabilities: ProbabilitiesSchema
    analysis_time_ms: float
    explanation: Optional[str] = None
    status: str
    created_at: Optional[str] = None


class HistoryListResponse(BaseModel):
    items: List[HistoryItemSchema]
    total: int
    page: int
    limit: int


class HealthResponse(BaseModel):
    status: str
    app_name: str
    app_version: str
    model_loaded: bool
    model_name: str
    device: str


class ModelInfoResponse(BaseModel):
    model_architecture: str
    is_trained: bool
    classes: List[str]
    input_shape: Dict[str, Any]
    feature_extractor: str
    temporal_learner: Optional[str] = None
    attention_mechanism: Optional[str] = None
    device: str
