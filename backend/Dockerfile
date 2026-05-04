FROM python:3.12-slim

# Prevent Python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for Docker layer caching)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for static/media files
RUN mkdir -p /app/backend/staticfiles /app/backend/mediafiles

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Entrypoint: run migrations + collectstatic (as root) then switch to gunicorn as non-root
ENTRYPOINT ["sh", "-c", "cd /app/backend && \
    echo 'Checking database...' && \
    pg_isready -h \"${DB_HOST:-localhost}\" -p \"${DB_PORT:-5432}\" -U \"${DB_USER:-postgres}\" || true && \
    echo 'Running migrations...' && python manage.py migrate --noinput && \
    echo 'Collecting static files...' && python manage.py collectstatic --noinput --clear && \
    if [ \"$SEED_DEMO_DATA\" = \"true\" ]; then echo 'Seeding demo data...' && python manage.py seed_demo_data --patients 10 --doctors 5 2>/dev/null || true; fi && \
    echo 'Starting gunicorn...' && \
    exec gunicorn --bind 0.0.0.0:8000 --workers 2 --threads 4 config.wsgi:application"]
