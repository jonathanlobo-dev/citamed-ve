#!/bin/bash
# ============================================
# CITAMED.VE Backend - Docker Run Script
# ============================================

set -e

echo "========================================"
echo "  CITAMED.VE Backend - Docker Run"
echo "========================================"
echo ""

# Stop existing container if running
docker stop citamed-backend 2>/dev/null || true
docker rm citamed-backend 2>/dev/null || true

echo "Starting container..."
docker run -d \
  --name citamed-backend \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  citamed-backend:latest

echo ""
echo "Container started!"
echo ""
echo "Status:"
docker ps | grep citamed-backend

echo ""
echo "View logs:"
echo "docker logs -f citamed-backend"
echo ""
echo "Health check:"
echo "curl http://localhost:5000/api/health"
echo ""
