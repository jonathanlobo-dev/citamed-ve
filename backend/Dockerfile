# ============================================
# CITAMED.VE Backend - Production Dockerfile
# Multi-stage build optimizado
# ============================================

# ============================================
# STAGE 1: BUILDER
# ============================================
FROM node:18-alpine AS builder

LABEL maintainer="CITAMED.VE <info@citamed.ve>"
LABEL description="CITAMED.VE Backend API - Builder Stage"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for building
RUN npm ci --quiet

# Copy source code
COPY . .

# ============================================
# STAGE 2: PRODUCTION
# ============================================
FROM node:18-alpine AS production

LABEL maintainer="CITAMED.VE <info@citamed.ve>"
LABEL description="CITAMED.VE Backend API - Production"
LABEL version="1.0.0"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production --quiet && \
    npm cache clean --force

# Copy source from builder
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/server.js"]
