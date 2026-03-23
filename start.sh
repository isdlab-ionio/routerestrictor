#!/bin/bash

# RouteRestrictor - Corfu Street Access Management
# Startup script - launches backend and frontend, opens browser

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "Done."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend (FastAPI)..."
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend (Vite)..."
cd "$FRONTEND_DIR"
npm run dev -- --port 5173 &
FRONTEND_PID=$!

# Wait for frontend to be ready, then open browser
echo "Waiting for servers to start..."
sleep 3
open http://localhost:5173

echo ""
echo "RouteRestrictor is running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop."

wait
