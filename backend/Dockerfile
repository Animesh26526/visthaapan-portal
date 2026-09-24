# Multi-stage Dockerfile for VISTHAAPAN Backend (Node.js + Python + Google OR-Tools)
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies and compile TypeScript
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime image
FROM node:22-slim

WORKDIR /app

# Install Python 3, pip, and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up Python virtual environment for OR-Tools & ML runtime dependencies
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy production node dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application and runtime assets
COPY --from=builder /app/dist ./dist
COPY ai/ ./ai/
COPY migrations/ ./migrations/

# Default environment settings
ENV NODE_ENV=production
ENV PORT=5000
ENV PYTHON_BIN=/opt/venv/bin/python

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
