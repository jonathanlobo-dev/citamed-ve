#!/bin/bash
# ============================================
# CITAMED.VE Backend - Docker Build Script
# ============================================

set -e

echo "========================================"
echo "  CITAMED.VE Backend - Docker Build"
echo "========================================"
echo ""

echo "Building Docker image..."
docker build -t citamed-backend:latest \
  --build-arg NODE_ENV=production \
  --no-cache \
  .

echo ""
echo "Build completed!"
echo ""
echo "Image size:"
docker images citamed-backend:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "To run the container:"
echo "docker run -p 5000:5000 --env-file .env citamed-backend:latest"
echo ""
