# ===================================
# Stage 1: Build TypeScript Application
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript in /app/dist
RUN npm run build

# ===================================
# Stage 2: Production Execution Image
# ===================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy compiled dist from builder stage
COPY --from=builder /app/dist ./dist

# Expose HTTP port
EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]
