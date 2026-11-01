"""
Database Models for Synthetic Voice Detection History
------------------------------------------------------
SQLAlchemy Declarative Model storing historical audio analyses,
prediction metrics, acoustic characteristics, and visual previews.
"""

from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, Float, String, Text, Boolean, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class AnalysisRecord(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_name = Column(String(255), nullable=False)
    file_format = Column(String(32), nullable=False, default="wav")
    file_size_bytes = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Float, nullable=False, default=0.0)
    sample_rate = Column(Integer, nullable=False, default=16000)

    # Prediction Results
    prediction = Column(String(32), nullable=False)  # "BONAFIDE" or "SPOOF"
    confidence = Column(Float, nullable=False)
    bonafide_prob = Column(Float, nullable=False)
    spoof_prob = Column(Float, nullable=False)
    analysis_time_ms = Column(Float, nullable=False, default=0.0)
    explanation = Column(Text, nullable=True)

    # Acoustic Metadata
    spectral_centroid_hz = Column(Float, nullable=True)
    zero_crossing_rate = Column(Integer, nullable=True)
    rms_energy = Column(Float, nullable=True)

    # Model & Status
    model_version = Column(String(64), nullable=False, default="AudioCNNBiLSTM")
    status = Column(String(32), nullable=False, default="completed")

    # Visualizations and Detailed Segment Storage (as JSON strings)
    spectrogram_preview = Column(Text, nullable=True)
    mfcc_preview = Column(Text, nullable=True)
    segment_results = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "file_name": self.file_name,
            "file_format": self.file_format,
            "file_size_bytes": self.file_size_bytes,
            "duration_seconds": self.duration_seconds,
            "sample_rate": self.sample_rate,
            "prediction": self.prediction,
            "confidence": self.confidence,
            "probabilities": {
                "bonafide": self.bonafide_prob,
                "spoof": self.spoof_prob,
            },
            "analysis_time_ms": self.analysis_time_ms,
            "explanation": self.explanation,
            "acoustic_metadata": {
                "spectral_centroid_hz": self.spectral_centroid_hz,
                "zero_crossing_rate": self.zero_crossing_rate,
                "rms_energy": self.rms_energy,
            },
            "model_version": self.model_version,
            "status": self.status,
            "spectrogram_preview": json.loads(self.spectrogram_preview) if self.spectrogram_preview else None,
            "mfcc_preview": json.loads(self.mfcc_preview) if self.mfcc_preview else None,
            "segment_results": json.loads(self.segment_results) if self.segment_results else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
