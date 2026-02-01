#!/usr/bin/env python3
"""
Buffr ML Models - Complete Training Pipeline

Master script to train all Buffr ML models with comprehensive validation,
data preparation, training, and evaluation.

This script orchestrates the complete ML training workflow:
1. Environment validation
2. Data preparation (synthetic or from database)
3. Model training (all 4 ensembles)
4. Model evaluation
5. Performance reporting

Usage:
    python train_all_models.py                    # Full pipeline with synthetic data
    python train_all_models.py --use-db           # Use database instead of synthetic
    python train_all_models.py --models fraud credit  # Train specific models only
    python train_all_models.py --skip-validation   # Skip environment checks
"""

import os
import sys
import argparse
import logging
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import subprocess

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class BuffrMLTrainingPipeline:
    """
    Complete ML training pipeline for all Buffr models
    """
    
    def __init__(
        self,
        data_dir: Path = Path("./data"),
        model_dir: Path = Path("./models"),
        skip_validation: bool = False,
        use_database: bool = False
    ):
        """
        Initialize training pipeline
        
        Args:
            data_dir: Directory for training data
            model_dir: Directory for trained models
            skip_validation: Skip environment validation
            use_database: Use database instead of synthetic data
        """
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.skip_validation = skip_validation
        self.use_database = use_database
        
        # Create directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Pipeline results
        self.results: Dict[str, Any] = {
            'started_at': datetime.now().isoformat(),
            'steps_completed': [],
            'steps_failed': [],
            'models_trained': [],
            'models_failed': [],
            'final_status': 'unknown'
        }
    
    def validate_environment(self) -> bool:
        """
        Validate environment and dependencies
        
        Returns:
            True if validation passes
        """
        logger.info("=" * 80)
        logger.info("STEP 1: Environment Validation")
        logger.info("=" * 80)
        
        if self.skip_validation:
            logger.info("⏭️  Skipping validation (--skip-validation flag)")
            return True
        
        try:
            # Run validation script
            result = subprocess.run(
                [sys.executable, "validate_setup.py"],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent
            )
            
            if result.returncode == 0:
                logger.info("✅ Environment validation passed")
                logger.info(result.stdout)
                self.results['steps_completed'].append('validation')
                return True
            else:
                logger.error("❌ Environment validation failed")
                logger.error(result.stderr)
                self.results['steps_failed'].append('validation')
                return False
                
        except Exception as e:
            logger.error(f"❌ Validation error: {e}")
            self.results['steps_failed'].append('validation')
            return False
    
    def prepare_training_data(self) -> bool:
        """
        Prepare training data (synthetic or from database)
        
        Returns:
            True if data preparation succeeds
        """
        logger.info("=" * 80)
        logger.info("STEP 2: Data Preparation")
        logger.info("=" * 80)
        
        try:
            if self.use_database:
                logger.info("📊 Exporting data from database...")
                db_url = os.getenv('DATABASE_URL')
                if not db_url:
                    logger.warning("⚠️  DATABASE_URL not set, falling back to synthetic data")
                    self.use_database = False
            
            if self.use_database:
                # Export from database
                cmd = [
                    sys.executable,
                    "prepare_training_data.py",
                    "--export-transactions",
                    "--export-credit",
                    "--db-url", db_url,
                    "--days-back", "90"
                ]
            else:
                # Generate synthetic data
                logger.info("📊 Generating synthetic training data...")
                cmd = [
                    sys.executable,
                    "prepare_training_data.py",
                    "--generate-synthetic"
                ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent
            )
            
            if result.returncode == 0:
                logger.info("✅ Data preparation completed")
                logger.info(result.stdout)
                
                # Validate data quality
                logger.info("🔍 Validating data quality...")
                validate_result = subprocess.run(
                    [sys.executable, "prepare_training_data.py", "--validate"],
                    capture_output=True,
                    text=True,
                    cwd=Path(__file__).parent
                )
                
                if validate_result.returncode == 0:
                    logger.info("✅ Data validation passed")
                    logger.info(validate_result.stdout)
                else:
                    logger.warning("⚠️  Data validation warnings:")
                    logger.warning(validate_result.stderr)
                
                self.results['steps_completed'].append('data_preparation')
                return True
            else:
                logger.error("❌ Data preparation failed")
                logger.error(result.stderr)
                self.results['steps_failed'].append('data_preparation')
                return False
                
        except Exception as e:
            logger.error(f"❌ Data preparation error: {e}")
            self.results['steps_failed'].append('data_preparation')
            return False
    
    def train_models(
        self,
        models: Optional[List[str]] = None,
        no_cv: bool = False,
        no_smote: bool = False,
        cv_folds: int = 5
    ) -> bool:
        """
        Train ML models with ML best practices
        
        Args:
            models: List of models to train (None = all models)
                    Options: 'fraud', 'credit', 'spending', 'classification'
            no_cv: Disable cross-validation
            no_smote: Disable SMOTE for imbalanced data
            cv_folds: Number of CV folds (default: 5)
        
        Returns:
            True if training succeeds
        """
        logger.info("=" * 80)
        logger.info("STEP 3: Model Training")
        logger.info("=" * 80)
        
        try:
            # Build training command
            cmd = [sys.executable, "train_models.py"]
            
            if models is None or len(models) == 0:
                cmd.append("--all")
                logger.info("🎯 Training ALL models (4 ensembles)")
            else:
                for model in models:
                    if model in ['fraud', 'credit', 'spending', 'classification']:
                        cmd.append(f"--{model}")
                        logger.info(f"🎯 Training {model.upper()} model")
                    else:
                        logger.warning(f"⚠️  Unknown model: {model}, skipping")
            
            # ML Best Practice: Add cross-validation and SMOTE flags
            if no_cv:
                cmd.append("--no-cv")
                logger.info("⚠️  Cross-validation disabled")
            else:
                cmd.extend(["--cv-folds", str(cv_folds)])
                logger.info(f"✅ Cross-validation enabled ({cv_folds} folds)")
            
            if no_smote:
                cmd.append("--no-smote")
                logger.info("⚠️  SMOTE disabled")
            else:
                logger.info("✅ SMOTE enabled for imbalanced data")
            
            # Add directories
            cmd.extend(["--data-dir", str(self.data_dir)])
            cmd.extend(["--model-dir", str(self.model_dir)])
            
            logger.info(f"🚀 Starting training: {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent
            )
            
            if result.returncode == 0:
                logger.info("✅ Model training completed")
                logger.info(result.stdout)
                
                # Parse training summary if available
                summary_file = self.model_dir / "training_summary.json"
                if summary_file.exists():
                    with open(summary_file, 'r') as f:
                        summary = json.load(f)
                        self.results['training_summary'] = summary
                        logger.info(f"📊 Training summary saved to {summary_file}")
                
                self.results['steps_completed'].append('model_training')
                return True
            else:
                logger.error("❌ Model training failed")
                logger.error(result.stderr)
                self.results['steps_failed'].append('model_training')
                return False
                
        except Exception as e:
            logger.error(f"❌ Training error: {e}")
            self.results['steps_failed'].append('model_training')
            return False
    
    def evaluate_models(self) -> bool:
        """
        Evaluate trained models
        
        Returns:
            True if evaluation succeeds
        """
        logger.info("=" * 80)
        logger.info("STEP 4: Model Evaluation")
        logger.info("=" * 80)
        
        try:
            cmd = [
                sys.executable,
                "evaluate_models.py",
                "--all",
                "--model-dir", str(self.model_dir),
                "--data-dir", str(self.data_dir)
            ]
            
            logger.info("📊 Evaluating models...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent
            )
            
            if result.returncode == 0:
                logger.info("✅ Model evaluation completed")
                logger.info(result.stdout)
                self.results['steps_completed'].append('model_evaluation')
                return True
            else:
                logger.warning("⚠️  Model evaluation had issues")
                logger.warning(result.stderr)
                # Don't fail pipeline on evaluation issues
                self.results['steps_completed'].append('model_evaluation')
                return True
                
        except Exception as e:
            logger.warning(f"⚠️  Evaluation error: {e}")
            # Don't fail pipeline on evaluation issues
            return True
    
    def generate_report(self) -> None:
        """
        Generate training pipeline report
        """
        logger.info("=" * 80)
        logger.info("STEP 5: Generating Report")
        logger.info("=" * 80)
        
        self.results['completed_at'] = datetime.now().isoformat()
        self.results['final_status'] = 'success' if len(self.results['steps_failed']) == 0 else 'partial'
        
        # Save report
        report_file = self.model_dir / "training_pipeline_report.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        logger.info(f"📄 Report saved to {report_file}")
        
        # Print summary
        logger.info("=" * 80)
        logger.info("TRAINING PIPELINE SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Status: {self.results['final_status'].upper()}")
        logger.info(f"Started: {self.results['started_at']}")
        logger.info(f"Completed: {self.results['completed_at']}")
        logger.info(f"Steps Completed: {len(self.results['steps_completed'])}")
        logger.info(f"Steps Failed: {len(self.results['steps_failed'])}")
        
        if self.results['steps_completed']:
            logger.info("\n✅ Completed Steps:")
            for step in self.results['steps_completed']:
                logger.info(f"   - {step}")
        
        if self.results['steps_failed']:
            logger.info("\n❌ Failed Steps:")
            for step in self.results['steps_failed']:
                logger.info(f"   - {step}")
        
        logger.info("=" * 80)
    
    def run(
        self,
        models: Optional[List[str]] = None,
        skip_data_prep: bool = False,
        no_cv: bool = False,
        no_smote: bool = False,
        cv_folds: int = 5
    ) -> bool:
        """
        Run complete training pipeline with ML best practices
        
        Args:
            models: List of specific models to train (None = all)
            skip_data_prep: Skip data preparation step
            no_cv: Disable cross-validation
            no_smote: Disable SMOTE for imbalanced data
            cv_folds: Number of CV folds (default: 5)
        
        Returns:
            True if pipeline completes successfully
        """
        logger.info("=" * 80)
        logger.info("BUFFR ML MODELS - COMPLETE TRAINING PIPELINE")
        logger.info("=" * 80)
        logger.info(f"Data Directory: {self.data_dir}")
        logger.info(f"Model Directory: {self.model_dir}")
        logger.info(f"Use Database: {self.use_database}")
        logger.info("=" * 80)
        
        # Step 1: Validate environment
        if not self.validate_environment():
            logger.error("❌ Environment validation failed. Cannot proceed.")
            self.results['final_status'] = 'failed'
            return False
        
        # Step 2: Prepare data
        if not skip_data_prep:
            if not self.prepare_training_data():
                logger.error("❌ Data preparation failed. Cannot proceed.")
                self.results['final_status'] = 'failed'
                return False
        else:
            logger.info("⏭️  Skipping data preparation")
            self.results['steps_completed'].append('data_preparation_skipped')
        
        # Step 3: Train models
        if not self.train_models(models, no_cv=no_cv, no_smote=no_smote, cv_folds=cv_folds):
            logger.error("❌ Model training failed.")
            self.results['final_status'] = 'failed'
            self.generate_report()
            return False
        
        # Step 4: Evaluate models
        self.evaluate_models()
        
        # Step 5: Generate report
        self.generate_report()
        
        return self.results['final_status'] == 'success'


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Buffr ML Models - Complete Training Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train all models with synthetic data (with ML best practices)
  python train_all_models.py
  
  # Train specific models only
  python train_all_models.py --models fraud credit
  
  # Use database instead of synthetic data
  python train_all_models.py --use-db
  
  # Skip validation and data preparation
  python train_all_models.py --skip-validation --skip-data-prep
  
  # Disable cross-validation for faster training (development)
  python train_all_models.py --no-cv
  
  # Custom CV folds
  python train_all_models.py --cv-folds 10
  
  # Disable SMOTE (if data is balanced)
  python train_all_models.py --no-smote
        """
    )
    
    parser.add_argument(
        '--models',
        nargs='+',
        choices=['fraud', 'credit', 'spending', 'classification'],
        help='Specific models to train (default: all)'
    )
    
    parser.add_argument(
        '--use-db',
        action='store_true',
        help='Use database instead of synthetic data'
    )
    
    parser.add_argument(
        '--skip-validation',
        action='store_true',
        help='Skip environment validation'
    )
    
    parser.add_argument(
        '--skip-data-prep',
        action='store_true',
        help='Skip data preparation (use existing data)'
    )
    
    parser.add_argument(
        '--data-dir',
        type=str,
        default='./data',
        help='Data directory (default: ./data)'
    )
    
    parser.add_argument(
        '--model-dir',
        type=str,
        default='./models',
        help='Model directory (default: ./models)'
    )
    
    # ML Best Practice: Add flags for cross-validation and SMOTE
    parser.add_argument(
        '--no-cv',
        action='store_true',
        help='Disable cross-validation (faster training, less robust)'
    )
    
    parser.add_argument(
        '--no-smote',
        action='store_true',
        help='Disable SMOTE for imbalanced data handling'
    )
    
    parser.add_argument(
        '--cv-folds',
        type=int,
        default=5,
        help='Number of cross-validation folds (default: 5)'
    )
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = BuffrMLTrainingPipeline(
        data_dir=Path(args.data_dir),
        model_dir=Path(args.model_dir),
        skip_validation=args.skip_validation,
        use_database=args.use_db
    )
    
    # Run pipeline with ML best practice flags
    success = pipeline.run(
        models=args.models,
        skip_data_prep=args.skip_data_prep,
        no_cv=args.no_cv,
        no_smote=args.no_smote,
        cv_folds=args.cv_folds
    )
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
