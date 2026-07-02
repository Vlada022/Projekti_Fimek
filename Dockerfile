# Stage 1: Build the application
FROM node:20-slim AS builder

# Install system dependencies required for compiling native node modules like better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency configuration
COPY package*.json ./

# Install all dependencies (including devDependencies) to run compile-time build
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the frontend assets and compile the server code via esbuild
RUN npm run build

# Remove development dependencies to keep the production size minimal
RUN npm prune --production

# Stage 2: Runtime environment
FROM node:20-slim AS runner

WORKDIR /app

# Expose port 3000 (Cloud Run / AI Studio standard port)
ENV PORT=3000
ENV NODE_ENV=production

# Copy built code and necessary production modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

# Start the full-stack server
CMD ["npm", "start"]
