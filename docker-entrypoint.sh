#!/bin/sh
set -e

# Ensure /data directory exists
mkdir -p /data

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec "$@"
