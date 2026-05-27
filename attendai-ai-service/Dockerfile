# Slim Python image - opencv is optional so the default image stays small.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Non-root user. UID 1000 is required by Hugging Face Spaces; harmless elsewhere.
RUN groupadd --gid 1000 attendai \
 && useradd --uid 1000 --gid attendai --create-home attendai

WORKDIR /app

# System deps. libgl1 / libglib2 are only needed if you enable the OpenCV
# backend; leaving them out shaves ~80 MB off the image. Uncomment below if
# you set ATTENDAI_AI_FACE_BACKEND=opencv.
# RUN apt-get update && apt-get install -y --no-install-recommends \
#         libgl1 libglib2.0-0 \
#     && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=attendai:attendai app ./app
# Pre-create the storage dir so a fresh container doesn't fail on first write.
RUN mkdir -p ./storage/embeddings && chown -R attendai:attendai /app

USER attendai
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
