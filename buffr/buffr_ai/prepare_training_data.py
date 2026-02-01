"""
Training Data Preparation Utilities

Scripts to prepare and validate training data for Buffr ML models.

Usage:
    python prepare_training_data.py --export-transactions    # Export transactions from DB
    python prepare_training_data.py --export-credit          # Export credit data from DB
    python prepare_training_data.py --validate               # Validate data quality
    python prepare_training_data.py --generate-synthetic      # Generate synthetic data
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TrainingDataPreparator:
    """
    Utilities for preparing training data
    """
    
    def __init__(self, data_dir: Path = Path("./data")):
        """
        Initialize data preparator
        
        Args:
            data_dir: Directory to store training data
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    def export_transactions_from_db(
        self,
        db_url: Optional[str] = None,
        days_back: int = 90,
        output_file: Optional[Path] = None,
        limit: Optional[int] = None
    ) -> pd.DataFrame:
        """
        Export transaction data from database
        
        Args:
            db_url: Database connection URL
            days_back: Number of days of historical data
            output_file: Output CSV file path
            limit: Maximum number of records
            
        Returns:
            DataFrame with transactions
        """
        logger.info("Exporting transactions from database...")
        
        if db_url is None:
            db_url = os.getenv('DATABASE_URL')
        
        if db_url is None:
            logger.warning("No database URL provided, generating synthetic data instead")
            return self.generate_synthetic_transactions(n_samples=10000)
        
        try:
            # Try to connect to database
            # This is a placeholder - implement actual DB connection
            # based on your database setup (PostgreSQL, MySQL, etc.)
            
            # Example for PostgreSQL with SQLAlchemy:
            # from sqlalchemy import create_engine
            # engine = create_engine(db_url)
            # query = f"""
            #     SELECT * FROM transactions
            #     WHERE created_at >= NOW() - INTERVAL '{days_back} days'
            #     ORDER BY created_at DESC
            #     {'LIMIT ' + str(limit) if limit else ''}
            # """
            # df = pd.read_sql(query, engine)
            
            logger.warning("Database connection not implemented, generating synthetic data")
            return self.generate_synthetic_transactions(n_samples=limit or 10000)
            
        except Exception as e:
            logger.error(f"Database export failed: {e}")
            logger.info("Generating synthetic data instead...")
            return self.generate_synthetic_transactions(n_samples=limit or 10000)
    
    def export_credit_data_from_db(
        self,
        db_url: Optional[str] = None,
        output_file: Optional[Path] = None,
        limit: Optional[int] = None
    ) -> pd.DataFrame:
        """
        Export credit/loan data from database
        
        Args:
            db_url: Database connection URL
            output_file: Output CSV file path
            limit: Maximum number of records
            
        Returns:
            DataFrame with credit data
        """
        logger.info("Exporting credit data from database...")
        
        if db_url is None:
            db_url = os.getenv('DATABASE_URL')
        
        if db_url is None:
            logger.warning("No database URL provided, generating synthetic data instead")
            return self.generate_synthetic_credit_data(n_samples=5000)
        
        try:
            # Try to connect to database
            # Placeholder for actual DB connection
            
            logger.warning("Database connection not implemented, generating synthetic data")
            return self.generate_synthetic_credit_data(n_samples=limit or 5000)
            
        except Exception as e:
            logger.error(f"Database export failed: {e}")
            logger.info("Generating synthetic data instead...")
            return self.generate_synthetic_credit_data(n_samples=limit or 5000)
    
    def generate_synthetic_transactions(
        self,
        n_samples: int = 10000,
        output_file: Optional[Path] = None
    ) -> pd.DataFrame:
        """
        Generate synthetic transaction data aligned with REAL Namibian patterns
        
        Based on:
        - Bank of Namibia (BON) National Payment System statistics
        - Namibia Statistics Agency 2023 Census data
        - Real Namibian merchant names and spending patterns
        - Regional demographics (Khomas, Oshana, Ohangwena, etc.)
        - G2P voucher recipient patterns (N$1,600-3,000/month grants)
        
        Args:
            n_samples: Number of samples to generate
            output_file: Output CSV file path
            
        Returns:
            DataFrame with synthetic transactions aligned to Namibian context
        """
        logger.info(f"Generating {n_samples} synthetic transactions with REAL Namibian patterns...")
        
        np.random.seed(42)
        
        # REAL Namibian Merchants (from project documentation and research)
        NAMIBIAN_GROCERY_MERCHANTS = [
            'Model', 'Checkers', 'Spar', 'Woermann Brock', 'Shoprite', 'OK Foods',
            'Metro', 'Game', 'Makro', 'Food Lovers Market'
        ]
        
        NAMIBIAN_FUEL_MERCHANTS = [
            'Engen', 'Shell', 'Caltex', 'Puma', 'Total', 'BP'
        ]
        
        NAMIBIAN_UTILITY_MERCHANTS = [
            'NamPower', 'City of Windhoek', 'NamWater', 'Telecom Namibia', 'MTC', 'Paratus'
        ]
        
        NAMIBIAN_BANKING_MERCHANTS = [
            'FNB Namibia', 'Standard Bank Namibia', 'Bank Windhoek', 'Nedbank Namibia',
            'First National Bank', 'Bank of Namibia'
        ]
        
        NAMIBIAN_RETAIL_MERCHANTS = [
            'Jet', 'Edgars', 'Truworths', 'Foschini', 'Mr Price', 'Pep Stores',
            'Game', 'Makro', 'Builders Warehouse', 'Incredible Connection'
        ]
        
        NAMIBIAN_DINING_MERCHANTS = [
            'Wimpy', 'KFC', 'Steers', 'Galito\'s', 'Grill Addicts', 'Spur', 
            'Ocean Basket', 'Mugg & Bean', 'Café Prestige', 'Joe\'s Beerhouse', 'The Stellenbosch',
            'Leo\'s at the Castle', 'The Tug', 'The Rooftop', 'Nice Restaurant', 'Café Zoo',
            'The Wine Bar', 'The Social', 'Coco\'s Restaurant', 'The Craft'
        ]
        
        NAMIBIAN_HEALTH_MERCHANTS = [
            'Clicks', 'Dis-Chem', 'Medi-Post', 'NamPharm', 'Medi-Chem', 'Pharmacy Direct'
        ]
        
        # Combine all merchants with realistic distribution
        # Based on 2024 spending: 33% food, 14% housing/utilities, 14% appliances
        all_merchants = (
            NAMIBIAN_GROCERY_MERCHANTS * 33 +  # 33% food spending
            NAMIBIAN_FUEL_MERCHANTS * 10 +      # ~10% transport
            NAMIBIAN_UTILITY_MERCHANTS * 14 +  # 14% utilities
            NAMIBIAN_BANKING_MERCHANTS * 5 +    # ~5% banking
            NAMIBIAN_RETAIL_MERCHANTS * 14 +    # 14% retail/appliances
            NAMIBIAN_DINING_MERCHANTS * 15 +    # ~15% dining
            NAMIBIAN_HEALTH_MERCHANTS * 9       # ~9% health
        )
        
        # REAL Namibian Merchant Categories with MCC codes
        merchant_categories = {
            'GROCERIES': {
                'merchants': NAMIBIAN_GROCERY_MERCHANTS,
                'mcc': 5411,
                'amount_mean': 250.0,  # Average grocery transaction (NAD)
                'amount_std': 150.0,
                'weight': 0.33  # 33% of spending
            },
            'FUEL': {
                'merchants': NAMIBIAN_FUEL_MERCHANTS,
                'mcc': 5542,
                'amount_mean': 500.0,  # Fuel fill-up (NAD)
                'amount_std': 200.0,
                'weight': 0.10
            },
            'UTILITIES': {
                'merchants': NAMIBIAN_UTILITY_MERCHANTS,
                'mcc': 4900,
                'amount_mean': 800.0,  # Monthly utilities (NAD)
                'amount_std': 300.0,
                'weight': 0.14
            },
            'BANKING': {
                'merchants': NAMIBIAN_BANKING_MERCHANTS,
                'mcc': 6012,
                'amount_mean': 50.0,  # Bank fees (NAD)
                'amount_std': 30.0,
                'weight': 0.05
            },
            'RETAIL': {
                'merchants': NAMIBIAN_RETAIL_MERCHANTS,
                'mcc': 5311,
                'amount_mean': 400.0,  # Retail purchases (NAD)
                'amount_std': 300.0,
                'weight': 0.14
            },
            'DINING': {
                'merchants': NAMIBIAN_DINING_MERCHANTS,
                'mcc': 5812,
                'amount_mean': 150.0,  # Restaurant meal (NAD)
                'amount_std': 100.0,
                'weight': 0.15
            },
            'HEALTH': {
                'merchants': NAMIBIAN_HEALTH_MERCHANTS,
                'mcc': 5912,
                'amount_mean': 200.0,  # Pharmacy/health (NAD)
                'amount_std': 150.0,
                'weight': 0.09
            }
        }
        
        # REAL Namibian Regions (from 2023 Census)
        NAMIBIAN_REGIONS = {
            'Khomas': {
                'lat_range': (-22.7, -22.4),  # Windhoek area
                'lon_range': (16.8, 17.2),
                'urban_rate': 0.995,  # Mostly urban (Windhoek)
                'population_share': 0.164  # 16.4% of population
            },
            'Oshana': {
                'lat_range': (-18.0, -17.5),  # Oshakati area
                'lon_range': (15.5, 16.0),
                'urban_rate': 0.532,  # 53.2% urban
                'population_share': 0.076
            },
            'Ohangwena': {
                'lat_range': (-17.8, -17.2),
                'lon_range': (15.5, 16.5),
                'urban_rate': 0.20,  # Mostly rural
                'population_share': 0.082
            },
            'Omusati': {
                'lat_range': (-18.5, -17.5),
                'lon_range': (14.5, 15.5),
                'urban_rate': 0.15,
                'population_share': 0.078
            },
            'Oshikoto': {
                'lat_range': (-19.0, -18.0),
                'lon_range': (16.0, 17.5),
                'urban_rate': 0.25,
                'population_share': 0.075
            },
            'Erongo': {
                'lat_range': (-22.5, -21.0),  # Swakopmund/Walvis Bay
                'lon_range': (14.0, 15.5),
                'urban_rate': 0.85,
                'population_share': 0.055
            },
            'Hardap': {
                'lat_range': (-24.5, -23.5),  # Mariental area
                'lon_range': (17.0, 18.5),
                'urban_rate': 0.40,
                'population_share': 0.035
            },
            'Karas': {
                'lat_range': (-27.0, -26.0),  # Keetmanshoop area
                'lon_range': (17.5, 18.5),
                'urban_rate': 0.50,
                'population_share': 0.028
            }
        }
        
        # Assign users to regions based on population share
        region_names = list(NAMIBIAN_REGIONS.keys())
        region_weights = np.array([NAMIBIAN_REGIONS[r]['population_share'] for r in region_names])
        # Normalize weights to sum to 1
        region_weights = region_weights / region_weights.sum()
        user_regions = np.random.choice(region_names, size=n_samples, p=region_weights)
        
        # Generate transaction data with REAL Namibian patterns
        transaction_ids = [f"TXN_{i:06d}" for i in range(n_samples)]
        user_ids = np.random.choice([f"USER_{i:04d}" for i in range(1000)], n_samples)
        
        # Assign categories based on spending weights
        category_weights = [cat['weight'] for cat in merchant_categories.values()]
        categories = np.random.choice(list(merchant_categories.keys()), size=n_samples, p=category_weights)
        
        # Generate amounts based on category-specific distributions
        amounts = []
        merchant_names = []
        merchant_mccs = []
        merchant_cats = []
        
        for cat in categories:
            cat_info = merchant_categories[cat]
            # Log-normal distribution for realistic amounts (always positive, right-skewed)
            amount = np.random.lognormal(
                mean=np.log(cat_info['amount_mean']),
                sigma=np.log(1 + cat_info['amount_std'] / cat_info['amount_mean'])
            )
            amounts.append(max(10.0, amount))  # Minimum NAD 10
            
            # Select merchant from category
            merchant = np.random.choice(cat_info['merchants'])
            merchant_names.append(merchant)
            merchant_mccs.append(cat_info['mcc'])
            merchant_cats.append(cat)
        
        # Generate locations based on assigned regions
        user_lats = []
        user_lons = []
        merchant_lats = []
        merchant_lons = []
        
        for region_name in user_regions:
            region = NAMIBIAN_REGIONS[region_name]
            user_lat = np.random.uniform(*region['lat_range'])
            user_lon = np.random.uniform(*region['lon_range'])
            user_lats.append(user_lat)
            user_lons.append(user_lon)
            
            # Merchant in same region (most transactions are local)
            if np.random.random() < 0.85:  # 85% local transactions
                merchant_lat = np.random.uniform(*region['lat_range'])
                merchant_lon = np.random.uniform(*region['lon_range'])
            else:  # 15% cross-region (travel, online)
                other_region = np.random.choice(region_names)
                merchant_lat = np.random.uniform(*NAMIBIAN_REGIONS[other_region]['lat_range'])
                merchant_lon = np.random.uniform(*NAMIBIAN_REGIONS[other_region]['lon_range'])
            
            merchant_lats.append(merchant_lat)
            merchant_lons.append(merchant_lon)
        
        # Generate timestamps with realistic patterns
        # Peak hours: 7-9am, 12-2pm, 5-7pm (Namibian business hours)
        timestamps = []
        base_date = datetime.now() - timedelta(days=90)
        
        for i in range(n_samples):
            # Add some randomness to timestamps
            days_offset = np.random.exponential(scale=30)  # More recent transactions more likely
            days_offset = min(days_offset, 90)
            
            # Realistic time distribution (more transactions during business hours)
            hour_weights = np.array([
                0.02, 0.02, 0.02, 0.02, 0.02, 0.02,  # 0-5am: very low
                0.05, 0.10, 0.08,  # 6-8am: morning rush
                0.04, 0.04, 0.06, 0.08,  # 9-12pm: business hours
                0.10, 0.08,  # 12-2pm: lunch
                0.05, 0.05, 0.08, 0.10,  # 2-6pm: afternoon/evening rush
                0.06, 0.04, 0.03, 0.02, 0.02  # 6pm-12am: evening
            ])
            hour_weights = hour_weights / hour_weights.sum()
            
            hour = np.random.choice(24, p=hour_weights)
            minute = np.random.randint(0, 60)
            
            timestamp = base_date + timedelta(days=days_offset, hours=hour, minutes=minute)
            timestamps.append(timestamp)
        
        # Sort by timestamp
        sorted_indices = np.argsort(timestamps)
        timestamps = [timestamps[i] for i in sorted_indices]
        amounts = [amounts[i] for i in sorted_indices]
        merchant_names = [merchant_names[i] for i in sorted_indices]
        merchant_mccs = [merchant_mccs[i] for i in sorted_indices]
        merchant_cats = [merchant_cats[i] for i in sorted_indices]
        user_lats = [user_lats[i] for i in sorted_indices]
        user_lons = [user_lons[i] for i in sorted_indices]
        merchant_lats = [merchant_lats[i] for i in sorted_indices]
        merchant_lons = [merchant_lons[i] for i in sorted_indices]
        user_ids = [user_ids[i] for i in sorted_indices]
        transaction_ids = [transaction_ids[i] for i in sorted_indices]
        
        # Generate fraud labels (5% fraud rate - realistic for payment systems)
        # Fraud patterns: unusual amounts, unusual times, unusual locations
        is_fraud = []
        for i in range(n_samples):
            fraud_score = 0.0
            
            # Unusual amount (very high or very low for category)
            cat_info = merchant_categories[merchant_cats[i]]
            if amounts[i] > cat_info['amount_mean'] + 3 * cat_info['amount_std']:
                fraud_score += 0.3
            if amounts[i] < cat_info['amount_mean'] * 0.1:
                fraud_score += 0.2
            
            # Unusual time (late night/early morning)
            hour = timestamps[i].hour
            if hour >= 23 or hour <= 5:
                fraud_score += 0.2
            
            # Cross-region transaction (higher fraud risk)
            distance = np.sqrt(
                (user_lats[i] - merchant_lats[i])**2 + 
                (user_lons[i] - merchant_lons[i])**2
            )
            if distance > 0.5:  # Large distance
                fraud_score += 0.3
            
            # Random base fraud rate + fraud score
            is_fraud.append(1 if np.random.random() < (0.03 + min(fraud_score, 0.07)) else 0)
        
        # Account age (based on Namibian demographics: 71.1% under 35, median age 22)
        # Younger users = newer accounts, older users = established accounts
        account_ages = []
        for _ in range(n_samples):
            # Simulate user age distribution
            user_age_prob = np.random.random()
            if user_age_prob < 0.711:  # 71.1% under 35
                # Younger users: newer accounts (0-2 years)
                account_age = np.random.exponential(scale=180)  # ~6 months average
            else:
                # Older users: established accounts (1-10 years)
                account_age = 365 + np.random.exponential(scale=1095)  # 1-4 years average
            account_ages.append(int(min(account_age, 3650)))  # Max 10 years
        
        # Device fingerprints
        device_fingerprints = [f"DEV_{np.random.randint(1000, 9999)}" for _ in range(n_samples)]
        
        # Build DataFrame
        data = {
            'transaction_id': transaction_ids,
            'user_id': user_ids,
            'amount': amounts,
            'merchant_name': merchant_names,
            'merchant_mcc': merchant_mccs,
            'merchant_category': merchant_cats,
            'timestamp': timestamps,
            'is_fraud': is_fraud,
            'device_fingerprint': device_fingerprints,
            'user_location_lat': user_lats,
            'user_location_lon': user_lons,
            'merchant_location_lat': merchant_lats,
            'merchant_location_lon': merchant_lons,
            'account_age_days': account_ages,
            'region': user_regions
        }
        
        df = pd.DataFrame(data)
        
        if output_file is None:
            output_file = self.data_dir / "transactions.csv"
        
        df.to_csv(output_file, index=False)
        
        # Log statistics
        fraud_rate = df['is_fraud'].mean()
        logger.info(f"Saved {len(df)} transactions to {output_file}")
        logger.info(f"Fraud rate: {fraud_rate:.2%}")
        logger.info(f"Average transaction amount: NAD {df['amount'].mean():.2f}")
        logger.info(f"Merchant distribution: {df['merchant_category'].value_counts().to_dict()}")
        logger.info(f"Regional distribution: {df['region'].value_counts().to_dict()}")
        
        return df
    
    def generate_synthetic_credit_data(
        self,
        n_samples: int = 5000,
        output_file: Optional[Path] = None
    ) -> pd.DataFrame:
        """
        Generate synthetic credit/loan data aligned with REAL Namibian merchant patterns
        
        Based on:
        - Buffr Lend progressive lending: NAD 500 - 10,000
        - Namibian merchant transaction volumes (N$600M/month market)
        - Realistic default rates for small merchants
        - Regional business patterns (urban vs rural)
        
        Args:
            n_samples: Number of samples to generate
            output_file: Output CSV file path
            
        Returns:
            DataFrame with synthetic credit data aligned to Namibian context
        """
        logger.info(f"Generating {n_samples} synthetic credit records with REAL Namibian merchant patterns...")
        
        np.random.seed(42)
        
        # REAL Namibian merchant revenue patterns
        # Based on N$600M/month market, average merchant revenue varies by type
        merchant_types = {
            'small_grocery': {
                'monthly_revenue_mean': 50000,  # NAD 50k/month (small Spar, OK Foods)
                'monthly_revenue_std': 20000,
                'transaction_count_mean': 500,
                'default_rate': 0.12  # Higher risk for small merchants
            },
            'large_grocery': {
                'monthly_revenue_mean': 500000,  # NAD 500k/month (Model, Checkers)
                'monthly_revenue_std': 150000,
                'transaction_count_mean': 5000,
                'default_rate': 0.05  # Lower risk for established chains
            },
            'fuel_station': {
                'monthly_revenue_mean': 800000,  # NAD 800k/month (high volume)
                'monthly_revenue_std': 300000,
                'transaction_count_mean': 4000,
                'default_rate': 0.08
            },
            'retail_store': {
                'monthly_revenue_mean': 200000,  # NAD 200k/month
                'monthly_revenue_std': 100000,
                'transaction_count_mean': 1500,
                'default_rate': 0.10
            },
            'restaurant': {
                'monthly_revenue_mean': 150000,  # NAD 150k/month
                'monthly_revenue_std': 80000,
                'transaction_count_mean': 2000,
                'default_rate': 0.15  # Higher risk (seasonal, competitive)
            },
            'utility_provider': {
                'monthly_revenue_mean': 2000000,  # NAD 2M/month (NamPower, etc.)
                'monthly_revenue_std': 500000,
                'transaction_count_mean': 10000,
                'default_rate': 0.02  # Very low risk (essential services)
            },
            'small_merchant': {
                'monthly_revenue_mean': 30000,  # NAD 30k/month (informal, small)
                'monthly_revenue_std': 15000,
                'transaction_count_mean': 300,
                'default_rate': 0.18  # Highest risk
            }
        }
        
        # Assign merchant types (realistic distribution)
        type_weights = [0.25, 0.15, 0.15, 0.20, 0.10, 0.05, 0.10]  # More small merchants
        merchant_type_names = list(merchant_types.keys())
        assigned_types = np.random.choice(merchant_type_names, size=n_samples, p=type_weights)
        
        # Generate credit data based on merchant type
        user_ids = []
        monthly_revenues = []
        transaction_counts = []
        avg_amounts = []
        default_rates = []
        
        for mtype in assigned_types:
            mtype_info = merchant_types[mtype]
            
            # Monthly revenue (log-normal for realistic distribution)
            revenue = np.random.lognormal(
                mean=np.log(mtype_info['monthly_revenue_mean']),
                sigma=np.log(1 + mtype_info['monthly_revenue_std'] / mtype_info['monthly_revenue_mean'])
            )
            monthly_revenues.append(max(5000, revenue))  # Minimum NAD 5k
            
            # Transaction count (Poisson distribution)
            tx_count = np.random.poisson(lam=mtype_info['transaction_count_mean'])
            transaction_counts.append(max(10, tx_count))
            
            # Average transaction amount (revenue / transactions)
            avg_amount = revenue / max(tx_count, 1)
            avg_amounts.append(avg_amount)
            
            default_rates.append(mtype_info['default_rate'])
        
        # Generate other features
        account_ages = np.random.exponential(scale=730, size=n_samples).astype(int)  # 0-5 years
        account_ages = np.clip(account_ages, 30, 3650)  # 1 month to 10 years
        
        # Transaction volume (90 days = 3 months)
        transaction_volumes_90d = [rev * 3 for rev in monthly_revenues]
        
        # Success/failure rates (better merchants have higher success rates)
        success_rates = []
        failed_counts = []
        for i, revenue in enumerate(monthly_revenues):
            # Higher revenue = better success rate
            base_success = 0.90 + min(0.08, (revenue / 1000000) * 0.1)  # 90-98%
            success_rate = np.clip(base_success, 0.85, 0.98)
            success_rates.append(success_rate)
            
            # Failed transactions (inverse of success)
            total_tx = transaction_counts[i] * 3  # 90 days
            failed = int(total_tx * (1 - success_rate))
            failed_counts.append(failed)
        
        successful_tx = [int(tx * 3 * rate) for tx, rate in zip(transaction_counts, success_rates)]
        
        # Average daily balance (correlated with revenue)
        avg_balances = []
        for revenue in monthly_revenues:
            # Merchants keep 10-30% of monthly revenue as working capital
            balance_ratio = np.random.uniform(0.10, 0.30)
            balance = revenue * balance_ratio
            avg_balances.append(balance)
        
        # Fraud incidents (rare, but higher for smaller merchants)
        fraud_incidents = []
        for revenue in monthly_revenues:
            # Smaller merchants have slightly higher fraud risk
            fraud_rate = 0.001 if revenue > 200000 else 0.002
            fraud_incidents.append(np.random.poisson(lam=fraud_rate * transaction_counts[monthly_revenues.index(revenue)] * 3))
        
        disputed_tx = [int(fraud * 0.5) for fraud in fraud_incidents]  # 50% of fraud becomes disputes
        chargebacks = [int(dispute * 0.3) for dispute in disputed_tx]  # 30% of disputes become chargebacks
        
        # Default labels (based on merchant type default rates + additional factors)
        defaulted = []
        for i in range(n_samples):
            base_default_rate = default_rates[i]
            
            # Adjust based on business health indicators
            if successful_tx[i] / max(transaction_counts[i] * 3, 1) < 0.85:  # Low success rate
                base_default_rate += 0.05
            if fraud_incidents[i] > 2:  # High fraud
                base_default_rate += 0.03
            if account_ages[i] < 180:  # New business (< 6 months)
                base_default_rate += 0.04
            
            defaulted.append(1 if np.random.random() < base_default_rate else 0)
        
        # Build DataFrame
        data = {
            'user_id': [f"MERCHANT_{i:04d}" for i in range(n_samples)],
            'monthly_avg_revenue': monthly_revenues,
            'transaction_volume_90d': transaction_volumes_90d,
            'avg_transaction_amount': avg_amounts,
            'transaction_count_90d': [tx * 3 for tx in transaction_counts],
            'account_age_days': account_ages,
            'successful_transactions': successful_tx,
            'failed_transactions': failed_counts,
            'avg_daily_balance': avg_balances,
            'fraud_incidents': fraud_incidents,
            'disputed_transactions': disputed_tx,
            'chargebacks': chargebacks,
            'defaulted': defaulted,
            'merchant_type': assigned_types
        }
        
        df = pd.DataFrame(data)
        
        if output_file is None:
            output_file = self.data_dir / "credit_data.csv"
        
        df.to_csv(output_file, index=False)
        
        # Log statistics
        default_rate = df['defaulted'].mean()
        logger.info(f"Saved {len(df)} credit records to {output_file}")
        logger.info(f"Default rate: {default_rate:.2%}")
        logger.info(f"Average monthly revenue: NAD {df['monthly_avg_revenue'].mean():,.2f}")
        logger.info(f"Merchant type distribution: {df['merchant_type'].value_counts().to_dict()}")
        logger.info(f"Revenue range: NAD {df['monthly_avg_revenue'].min():,.2f} - {df['monthly_avg_revenue'].max():,.2f}")
        
        return df
    
    def validate_data_quality(
        self,
        transaction_file: Optional[Path] = None,
        credit_file: Optional[Path] = None
    ) -> Dict[str, Any]:
        """
        Validate training data quality
        
        Args:
            transaction_file: Path to transaction CSV
            credit_file: Path to credit CSV
            
        Returns:
            Validation results
        """
        logger.info("Validating data quality...")
        
        results = {}
        
        # Validate transaction data
        if transaction_file is None:
            transaction_file = self.data_dir / "transactions.csv"
        
        if transaction_file.exists():
            df = pd.read_csv(transaction_file)
            results['transactions'] = {
                'total_records': len(df),
                'missing_values': df.isnull().sum().to_dict(),
                'fraud_rate': df.get('is_fraud', pd.Series([0])).mean() if 'is_fraud' in df.columns else None,
                'date_range': {
                    'start': str(df['timestamp'].min()) if 'timestamp' in df.columns else None,
                    'end': str(df['timestamp'].max()) if 'timestamp' in df.columns else None,
                },
                'unique_users': df['user_id'].nunique() if 'user_id' in df.columns else None,
            }
            logger.info(f"Transaction data: {results['transactions']}")
        else:
            logger.warning(f"Transaction file not found: {transaction_file}")
        
        # Validate credit data
        if credit_file is None:
            credit_file = self.data_dir / "credit_data.csv"
        
        if credit_file.exists():
            df = pd.read_csv(credit_file)
            results['credit'] = {
                'total_records': len(df),
                'missing_values': df.isnull().sum().to_dict(),
                'default_rate': df.get('defaulted', pd.Series([0])).mean() if 'defaulted' in df.columns else None,
                'unique_users': df['user_id'].nunique() if 'user_id' in df.columns else None,
            }
            logger.info(f"Credit data: {results['credit']}")
        else:
            logger.warning(f"Credit file not found: {credit_file}")
        
        return results


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Prepare Training Data for Buffr ML Models')
    parser.add_argument('--export-transactions', action='store_true', help='Export transactions from DB')
    parser.add_argument('--export-credit', action='store_true', help='Export credit data from DB')
    parser.add_argument('--generate-synthetic', action='store_true', help='Generate synthetic data')
    parser.add_argument('--validate', action='store_true', help='Validate data quality')
    parser.add_argument('--data-dir', type=str, default='./data', help='Data directory')
    parser.add_argument('--db-url', type=str, help='Database connection URL')
    parser.add_argument('--days-back', type=int, default=90, help='Days of historical data')
    parser.add_argument('--limit', type=int, help='Maximum number of records')
    
    args = parser.parse_args()
    
    preparator = TrainingDataPreparator(data_dir=Path(args.data_dir))
    
    if args.generate_synthetic or not any([args.export_transactions, args.export_credit, args.validate]):
        # Generate synthetic data by default
        logger.info("Generating synthetic training data...")
        preparator.generate_synthetic_transactions(n_samples=args.limit or 10000)
        preparator.generate_synthetic_credit_data(n_samples=args.limit or 5000)
    
    if args.export_transactions:
        preparator.export_transactions_from_db(
            db_url=args.db_url,
            days_back=args.days_back,
            limit=args.limit
        )
    
    if args.export_credit:
        preparator.export_credit_data_from_db(
            db_url=args.db_url,
            limit=args.limit
        )
    
    if args.validate:
        results = preparator.validate_data_quality()
        print("\nValidation Results:")
        print("=" * 60)
        for data_type, metrics in results.items():
            print(f"\n{data_type.upper()}:")
            for key, value in metrics.items():
                print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
