#!/bin/bash

# Install ML Dependencies for Buffr AI Backend
# This script installs pandas, scikit-learn, torch, and joblib

set -e

echo "📦 Installing ML dependencies for Buffr AI Backend..."
echo ""

cd "$(dirname "$0")/../buffr_ai"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip first
echo "⬆️  Upgrading pip..."
python3 -m pip install --upgrade pip --quiet

# Install ML dependencies
echo "📥 Installing pandas, scikit-learn, torch, joblib..."
python3 -m pip install pandas==2.2.3 scikit-learn==1.6.0 torch==2.5.1 joblib==1.4.2

# Verify installation
echo ""
echo "✅ Verifying installation..."
python3 -c "import pandas; import sklearn; import torch; import joblib; print('✅ All ML dependencies installed successfully!')"

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Restart the server: uvicorn main:app --port 8001 --reload"
echo "  2. Check health: curl http://localhost:8001/health"
echo "  3. Run tests: cd .. && ./scripts/test-ai-backend.sh"
