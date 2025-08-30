# =============================================================================
# PRODUCTION-GRADE NEXT.JS DOCKERFILE
# =============================================================================
# Multi-stage build optimized for security, performance, and size
# Based on Next.js 15+ with standalone output for minimal production image

# -----------------------------------------------------------------------------
# Dependencies stage - Install and cache dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Install security updates and required packages
RUN apk add --no-cache libc6-compat dumb-init && \
    apk upgrade

WORKDIR /app

# Copy package management files
COPY package.json yarn.lock ./

# Install dependencies with yarn
RUN corepack enable && \
    yarn config set nodeLinker node-modules && \
    yarn install --frozen-lockfile --network-timeout 1000000

# -----------------------------------------------------------------------------
# Builder stage - Build the application
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment variables for optimal performance
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the application with yarn
RUN corepack enable && \
    yarn install --frozen-lockfile && \
    yarn build

# -----------------------------------------------------------------------------
# Production stage - Minimal runtime image
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Install runtime dependencies and security updates
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Create necessary directories and set permissions
RUN mkdir -p .next/cache && \
    chown -R nextjs:nextjs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly and start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["yarn", "start"]

# =============================================================================
# LABELS FOR METADATA AND COMPLIANCE
# =============================================================================
LABEL maintainer="csiodadeldhura-admin-team" \
      name="csiodadeldhura-admin-frontend" \
      version="0.1.0" \
      description="Production Next.js application with security hardening" \
      org.opencontainers.image.title="CSI Odadel Dhura Admin Frontend" \
      org.opencontainers.image.description="Production-grade Next.js admin frontend" \
      org.opencontainers.image.vendor="CSI Odadel Dhura" \
      org.opencontainers.image.licenses="Private" \
      org.opencontainers.image.source="csiodadeldhura-admin-next-js-frontend"