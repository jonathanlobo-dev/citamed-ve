#!/bin/bash
# ============================================
# CITAMED.VE Frontend - Docker Run Script
# ============================================

set -e

echo "========================================"
echo "  CITAMED.VE Frontend - Docker Run"
echo "========================================"
echo ""

# Stop existing container if running
docker stop citamed-frontend 2>/dev/null || true
docker rm citamed-frontend 2>/dev/null || true

echo "Starting container..."
docker run -d \
  --name citamed-frontend \
  -p 80:80 \
  --restart unless-stopped \
  citamed-frontend:latest

echo ""
echo "Container started!"
echo ""
echo "Status:"
docker ps | grep citamed-frontend

echo ""
echo "Access the application:"
echo "http://localhost"
echo ""
echo "View logs:"
echo "docker logs -f citamed-frontend"
echo ""
