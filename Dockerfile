FROM python:3.11-slim

WORKDIR /app

# Install system audio libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application and artifacts
COPY backend /app/backend
COPY data /app/data
COPY experiments /app/experiments

ENV HOST=0.0.0.0
ENV PORT=8000
ENV DISABLE_SQLALCHEMY_CEXT=1

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
