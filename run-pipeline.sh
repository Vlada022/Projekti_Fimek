#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Setup cleanup on script exit (stop background server)
SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping background server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "===================================================="
echo "🚀 Starting Movie Review & Finder CI/CD Pipeline"
echo "===================================================="

# 1. Install Dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
npm ci

# 2. Build the Application
echo ""
echo "🛠️ Step 2: Building application assets & server..."
npm run build

# 3. Start the Server in Background
echo ""
echo "🌐 Step 3: Starting full-stack server..."
npm start &
SERVER_PID=$!

# 4. Wait for Server to be ready
echo ""
echo "⏳ Step 4: Waiting for server to be ready on port 3000..."
max_attempts=30
attempt=1
server_ready=0

while [ $attempt -le $max_attempts ]; do
  # Check if port 3000 is accepting connections
  if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is online and healthy at http://localhost:3000/api/health!"
    server_ready=1
    break
  fi
  echo "⌛ [Attempt $attempt/$max_attempts] Server not ready yet, retrying in 1s..."
  sleep 1
  attempt=$((attempt + 1))
done

if [ $server_ready -ne 1 ]; then
  echo "❌ Error: Server failed to start on port 3000 within 30 seconds."
  exit 1
fi

# 5. Run E2E Automation Tests (Playwright)
echo ""
echo "🧪 Step 5: Running Playwright E2E tests..."
# We run E2E tests. We set CI=true to make sure Playwright runs headless and handles CI environments properly.
export CI=true
npx playwright test

echo ""
echo "===================================================="
echo "🎉 CI/CD Pipeline Completed Successfully! All Tests Passed."
echo "===================================================="
