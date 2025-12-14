# ============================================
# CITAMED.VE Frontend - Production Dockerfile
# Multi-stage build: Node.js build + Nginx serve
# ============================================

# ============================================
# STAGE 1: BUILD
# ============================================
FROM node:18-alpine AS builder

LABEL maintainer="CITAMED.VE <info@citamed.ve>"
LABEL description="CITAMED.VE Frontend - Builder Stage"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --quiet

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# ============================================
# STAGE 2: PRODUCTION (Nginx)
# ============================================
FROM nginx:alpine AS production

LABEL maintainer="CITAMED.VE <info@citamed.ve>"
LABEL description="CITAMED.VE Frontend - Production"
LABEL version="1.0.0"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
