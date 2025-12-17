#!/bin/sh

set -e

echo "Dang chay migrate..."
python manage.py migrate

echo "Dang khoi dong server..."
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT