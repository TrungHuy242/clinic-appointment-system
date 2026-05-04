#!/bin/sh
set -e

echo "=========================================="
echo "  Clinic Appointment System - Entrypoint"
echo "=========================================="

# Change to backend directory where manage.py lives
cd /app/backend

# Wait for database using pg_isready (bundled with postgresql-client)
if [ -n "$DB_HOST" ]; then
    DB_USER_FOR_CHECK="${DB_USER:-postgres}"
    echo "Waiting for database at $DB_HOST:$DB_PORT..."
    until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER_FOR_CHECK" 2>/dev/null; do
        echo 'Database is unavailable - sleeping...'
        sleep 2
    done
    echo 'Database is up!'
fi

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Seed demo data if requested
if [ "$SEED_DEMO_DATA" = "true" ]; then
    echo "Seeding demo data..."
    python manage.py seed_demo_data --patients 10 --doctors 5 2>/dev/null || \
    echo "(seed_demo_data command not found - skipping)"
fi

echo "=========================================="
echo "  Starting application..."
echo "=========================================="

exec "$@"
