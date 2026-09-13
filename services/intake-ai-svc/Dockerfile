# Intake AI Service - Flask (symptom triage)
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app


ENV PYTHONPATH=/app:/app/shared

EXPOSE 5002
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "--workers", "2", "--threads", "2", "app:create_app()"]
