#!/bin/bash
# Buffr ML Training Setup Script
# Sets up the environment for ML model training

set -e

echo "=========================================="
echo "Buffr ML Training Setup"
echo "=========================================="

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check Python version
echo ""
echo "📋 Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Python $python_version"

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo "   ❌ Python 3.8+ required"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo ""
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "   ⚠️  requirements.txt not found, installing core ML packages..."
    pip install numpy pandas scikit-learn torch joblib pyyaml
fi

# Create directories
echo ""
echo "📂 Creating directories..."
mkdir -p ../data
mkdir -p ../models
echo "   ✅ Directories created"

# Validate setup
echo ""
echo "✅ Validating setup..."
python3 validate_setup.py

echo ""
echo "=========================================="
echo "Setup complete! 🎉"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. source venv/bin/activate"
echo "  2. python prepare_training_data.py --generate-synthetic"
echo "  3. python train_models.py --all"
echo "  4. python evaluate_models.py --all"
echo ""
