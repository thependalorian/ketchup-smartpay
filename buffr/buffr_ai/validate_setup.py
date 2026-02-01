"""
Setup Validation Script

Validates that all dependencies and setup are correct for ML training.

Usage:
    python validate_setup.py
"""

import sys
import importlib
from pathlib import Path
from typing import List, Tuple

def check_import(module_name: str, package_name: str = None) -> Tuple[bool, str]:
    """
    Check if a module can be imported
    
    Args:
        module_name: Name of the module to import
        package_name: Display name (if different from module_name)
        
    Returns:
        Tuple of (success, message)
    """
    if package_name is None:
        package_name = module_name
    
    try:
        importlib.import_module(module_name)
        return True, f"✅ {package_name}"
    except ImportError as e:
        return False, f"❌ {package_name} - {str(e)}"

def check_file_exists(file_path: Path) -> Tuple[bool, str]:
    """
    Check if a file exists
    
    Args:
        file_path: Path to check
        
    Returns:
        Tuple of (exists, message)
    """
    if file_path.exists():
        return True, f"✅ {file_path.name}"
    else:
        return False, f"❌ {file_path.name} - Not found"

def main():
    """Main validation function"""
    print("=" * 60)
    print("Buffr ML Training Setup Validation")
    print("=" * 60)
    
    base_dir = Path(__file__).parent
    all_checks_passed = True
    
    # Check Python version
    print("\n📋 Python Version:")
    print(f"   Python {sys.version}")
    if sys.version_info < (3, 8):
        print("   ⚠️  Warning: Python 3.8+ recommended")
        all_checks_passed = False
    else:
        print("   ✅ Python version OK")
    
    # Check core dependencies
    print("\n📦 Core Dependencies:")
    core_deps = [
        ("numpy", "NumPy"),
        ("pandas", "Pandas"),
        ("sklearn", "Scikit-learn"),
        ("torch", "PyTorch"),
        ("joblib", "Joblib"),
    ]
    
    for module, name in core_deps:
        success, message = check_import(module, name)
        print(f"   {message}")
        if not success:
            all_checks_passed = False
    
    # Check scikit-learn components
    print("\n🔬 Scikit-learn Components:")
    sklearn_components = [
        ("sklearn.linear_model", "Linear Models"),
        ("sklearn.ensemble", "Ensemble Methods"),
        ("sklearn.cluster", "Clustering"),
        ("sklearn.mixture", "Gaussian Mixture"),
        ("sklearn.preprocessing", "Preprocessing"),
        ("sklearn.metrics", "Metrics"),
        ("sklearn.model_selection", "Model Selection"),
    ]
    
    for module, name in sklearn_components:
        success, message = check_import(module, name)
        print(f"   {message}")
        if not success:
            all_checks_passed = False
    
    # Check PyTorch
    print("\n🔥 PyTorch:")
    try:
        import torch
        print(f"   ✅ PyTorch {torch.__version__}")
        print(f"   ✅ CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"   ✅ CUDA device: {torch.cuda.get_device_name(0)}")
    except ImportError:
        print("   ❌ PyTorch not installed")
        all_checks_passed = False
    
    # Check ML model files
    print("\n📁 ML Model Files:")
    ml_files = [
        base_dir / "ml" / "fraud_detection.py",
        base_dir / "ml" / "credit_scoring.py",
        base_dir / "ml" / "spending_analysis.py",
        base_dir / "ml" / "transaction_classification.py",
        base_dir / "ml" / "__init__.py",
    ]
    
    for file_path in ml_files:
        success, message = check_file_exists(file_path)
        print(f"   {message}")
        if not success:
            all_checks_passed = False
    
    # Check training scripts
    print("\n🚀 Training Scripts:")
    training_scripts = [
        base_dir / "train_models.py",
        base_dir / "prepare_training_data.py",
        base_dir / "evaluate_models.py",
    ]
    
    for file_path in training_scripts:
        success, message = check_file_exists(file_path)
        print(f"   {message}")
        if not success:
            all_checks_passed = False
    
    # Check configuration
    print("\n⚙️  Configuration:")
    config_file = base_dir / "training_config.yaml"
    success, message = check_file_exists(config_file)
    print(f"   {message}")
    if not success:
        all_checks_passed = False
    
    # Check directories
    print("\n📂 Directories:")
    data_dir = base_dir.parent / "data"
    model_dir = base_dir.parent / "models"
    
    print(f"   Data directory: {data_dir}")
    if not data_dir.exists():
        print(f"   ⚠️  Will be created automatically")
        data_dir.mkdir(parents=True, exist_ok=True)
    else:
        print(f"   ✅ Exists")
    
    print(f"   Model directory: {model_dir}")
    if not model_dir.exists():
        print(f"   ⚠️  Will be created automatically")
        model_dir.mkdir(parents=True, exist_ok=True)
    else:
        print(f"   ✅ Exists")
    
    # Test model imports
    print("\n🧪 Model Imports:")
    try:
        from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble
        print("   ✅ FraudDetectionEnsemble")
    except Exception as e:
        print(f"   ❌ FraudDetectionEnsemble - {e}")
        all_checks_passed = False
    
    try:
        from buffr_ai.ml.credit_scoring import CreditScoringEnsemble
        print("   ✅ CreditScoringEnsemble")
    except Exception as e:
        print(f"   ❌ CreditScoringEnsemble - {e}")
        all_checks_passed = False
    
    try:
        from buffr_ai.ml.spending_analysis import SpendingAnalysisEngine
        print("   ✅ SpendingAnalysisEngine")
    except Exception as e:
        print(f"   ❌ SpendingAnalysisEngine - {e}")
        all_checks_passed = False
    
    try:
        from buffr_ai.ml.transaction_classification import TransactionClassifier
        print("   ✅ TransactionClassifier")
    except Exception as e:
        print(f"   ❌ TransactionClassifier - {e}")
        all_checks_passed = False
    
    # Final summary
    print("\n" + "=" * 60)
    if all_checks_passed:
        print("✅ All checks passed! Ready to train models.")
        print("\nNext steps:")
        print("  1. python prepare_training_data.py --generate-synthetic")
        print("  2. python train_models.py --all")
        print("  3. python evaluate_models.py --all")
    else:
        print("❌ Some checks failed. Please install missing dependencies.")
        print("\nInstall dependencies:")
        print("  pip install -r requirements.txt")
        print("\nOr install ML dependencies:")
        print("  pip install numpy pandas scikit-learn torch joblib pyyaml")
    print("=" * 60)
    
    return 0 if all_checks_passed else 1

if __name__ == "__main__":
    sys.exit(main())
