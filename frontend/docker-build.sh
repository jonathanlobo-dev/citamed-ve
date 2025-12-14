#!/bin/bash
# ============================================
# CITAMED.VE Frontend - Docker Build Script
# ============================================

set -e

echo "========================================"
echo "  CITAMED.VE Frontend - Docker Build"
echo "========================================"
echo ""

# Default API URL (can be overridden)
API_URL=${VITE_API_URL:-"http://localhost:5000"}

echo "Building with API_URL: $API_URL"
echo ""

docker build -t citamed-frontend:latest \
  --build-arg VITE_API_URL=$API_URL \
  --no-cache \
  .

echo ""
echo "Build completed!"
echo ""
echo "Image size:"
docker images citamed-frontend:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "To run the container:"
echo "docker run -p 80:80 citamed-frontend:latest"
echo ""
