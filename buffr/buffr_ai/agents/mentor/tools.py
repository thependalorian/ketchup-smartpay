"""
Mentor Agent Tools - Financial Education & Guidance

Based on GSMA Digital Financial Literacy Toolkit principles
"""

from pydantic_ai import RunContext
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

from .agent import MentorDependencies, mentor_agent

logger = logging.getLogger(__name__)


@mentor_agent.tool
async def assess_financial_literacy(
    ctx: RunContext[MentorDependencies],
    user_id: str,
    assessment_answers: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Assess user's digital financial literacy level.

    Based on GSMA DFL framework covering:
    - Digital literacy (using mobile money, apps, SMS)
    - Financial literacy (saving, borrowing, budgeting)
    - Numeracy skills (calculations, percentages)
    - Fraud awareness (scams, security)

    Args:
        user_id: User identifier
        assessment_answers: User's answers to literacy questions

    Returns:
        {
            'literacy_level': str,  # 'basic', 'intermediate', 'advanced'
            'digital_literacy_score': float,
            'financial_literacy_score': float,
            'numeracy_score': float,
            'fraud_awareness_score': float,
            'strengths': list,
            'areas_for_improvement': list,
            'recommended_learning_path': str
        }
    """
    try:
        # Calculate scores from assessment answers
        digital_score = assessment_answers.get('digital_questions_correct', 0) / max(assessment_answers.get('digital_questions_total', 1), 1)
        financial_score = assessment_answers.get('financial_questions_correct', 0) / max(assessment_answers.get('financial_questions_total', 1), 1)
        numeracy_score = assessment_answers.get('numeracy_questions_correct', 0) / max(assessment_answers.get('numeracy_questions_total', 1), 1)
        fraud_score = assessment_answers.get('fraud_questions_correct', 0) / max(assessment_answers.get('fraud_questions_total', 1), 1)

        overall_score = (digital_score + financial_score + numeracy_score + fraud_score) / 4

        # Determine literacy level
        if overall_score >= 0.7:
            literacy_level = 'advanced'
        elif overall_score >= 0.4:
            literacy_level = 'intermediate'
        else:
            literacy_level = 'basic'

        # Identify strengths and areas for improvement
        strengths = []
        areas_for_improvement = []

        if digital_score >= 0.7:
            strengths.append("Digital literacy (using mobile money and apps)")
        else:
            areas_for_improvement.append("Digital literacy - practice using Buffr features")

        if financial_score >= 0.7:
            strengths.append("Financial literacy (budgeting and saving)")
        else:
            areas_for_improvement.append("Financial literacy - learn budgeting basics")

        if numeracy_score >= 0.7:
            strengths.append("Numeracy (financial calculations)")
        else:
            areas_for_improvement.append("Numeracy - understand interest rates and fees")

        if fraud_score >= 0.7:
            strengths.append("Fraud awareness (security best practices)")
        else:
            areas_for_improvement.append("Fraud awareness - learn to identify scams")

        # Recommend learning path
        if literacy_level == 'basic':
            learning_path = 'foundational_skills'
        elif literacy_level == 'intermediate':
            learning_path = 'financial_management'
        else:
            learning_path = 'advanced_strategies'

        # Store assessment
        from .db_utils import store_literacy_assessment
        await store_literacy_assessment(
            ctx.deps.db_pool,
            user_id,
            {
                'literacy_level': literacy_level,
                'overall_score': overall_score,
                'digital_score': digital_score,
                'financial_score': financial_score,
                'numeracy_score': numeracy_score,
                'fraud_score': fraud_score
            }
        )

        return {
            'user_id': user_id,
            'literacy_level': literacy_level,
            'overall_score': float(overall_score),
            'digital_literacy_score': float(digital_score),
            'financial_literacy_score': float(financial_score),
            'numeracy_score': float(numeracy_score),
            'fraud_awareness_score': float(fraud_score),
            'strengths': strengths,
            'areas_for_improvement': areas_for_improvement,
            'recommended_learning_path': learning_path
        }

    except Exception as e:
        logger.error(f"Literacy assessment failed: {e}")
        return {
            'error': str(e),
            'literacy_level': 'unknown'
        }


@mentor_agent.tool
async def get_learning_path(
    ctx: RunContext[MentorDependencies],
    user_id: str,
    literacy_level: str = 'intermediate'
) -> Dict[str, Any]:
    """
    Generate personalized learning path based on user's literacy level.

    Learning paths cover:
    1. Foundational Skills (basic)
       - Using Buffr mobile app
       - Basic transactions (send/receive money)
       - Understanding fees and charges
       - Basic security practices

    2. Financial Management (intermediate)
       - Budgeting and expense tracking
       - Savings strategies
       - Understanding credit and loans
       - Fraud prevention techniques

    3. Advanced Strategies (advanced)
       - Investment basics
       - Tax optimization (Namibian)
       - Retirement planning
       - Building credit score

    Args:
        user_id: User identifier
        literacy_level: 'basic', 'intermediate', or 'advanced'

    Returns:
        {
            'learning_path': str,
            'modules': list,
            'estimated_completion_time': str,
            'next_lesson': dict
        }
    """
    try:
        learning_paths = {
            'basic': {
                'name': 'Foundational Digital Financial Skills',
                'modules': [
                    {
                        'title': 'Getting Started with Buffr',
                        'lessons': [
                            'Creating your account safely',
                            'Understanding your dashboard',
                            'Making your first transaction',
                            'Checking your balance'
                        ],
                        'duration': '30 minutes'
                    },
                    {
                        'title': 'Safe Money Transfers',
                        'lessons': [
                            'How to send money securely',
                            'Verifying recipient details',
                            'Understanding transaction fees',
                            'Getting transaction receipts'
                        ],
                        'duration': '45 minutes'
                    },
                    {
                        'title': 'Basic Security Practices',
                        'lessons': [
                            'Creating a strong PIN',
                            'Recognizing common scams',
                            'What to do if you suspect fraud',
                            'Protecting your account information'
                        ],
                        'duration': '40 minutes'
                    }
                ],
                'estimated_time': '2 hours'
            },
            'intermediate': {
                'name': 'Financial Management Skills',
                'modules': [
                    {
                        'title': 'Budgeting Basics',
                        'lessons': [
                            'Creating a monthly budget',
                            'Tracking your expenses with Buffr',
                            'Understanding spending categories',
                            'Setting budget limits'
                        ],
                        'duration': '1 hour'
                    },
                    {
                        'title': 'Savings Strategies',
                        'lessons': [
                            'Setting savings goals',
                            'Automatic savings with Buffr',
                            'Understanding interest rates',
                            'Building an emergency fund'
                        ],
                        'duration': '50 minutes'
                    },
                    {
                        'title': 'Understanding Credit & Loans',
                        'lessons': [
                            'What is Buffr Lend?',
                            'How credit scores work',
                            'Understanding loan terms (NAD 500-10,000)',
                            'Responsible borrowing practices'
                        ],
                        'duration': '1 hour'
                    },
                    {
                        'title': 'Fraud Prevention',
                        'lessons': [
                            'Advanced scam detection',
                            'Protecting your data',
                            'Safe mobile banking practices',
                            'Reporting fraud to authorities'
                        ],
                        'duration': '45 minutes'
                    }
                ],
                'estimated_time': '4 hours'
            },
            'advanced': {
                'name': 'Advanced Financial Strategies',
                'modules': [
                    {
                        'title': 'Investment Fundamentals',
                        'lessons': [
                            'Introduction to Namibian Stock Exchange (NSX)',
                            'Understanding risk vs. return',
                            'Building a diversified portfolio',
                            'Investment options in Namibia'
                        ],
                        'duration': '1.5 hours'
                    },
                    {
                        'title': 'Tax Planning (Namibia)',
                        'lessons': [
                            'Understanding Namibian tax system',
                            'Tax-efficient savings strategies',
                            'Deductions and credits',
                            'Filing requirements'
                        ],
                        'duration': '1 hour'
                    },
                    {
                        'title': 'Retirement Planning',
                        'lessons': [
                            'Calculating retirement needs',
                            'Pension fund options in Namibia',
                            'Social security benefits',
                            'Creating a retirement strategy'
                        ],
                        'duration': '1.5 hours'
                    },
                    {
                        'title': 'Building Excellent Credit',
                        'lessons': [
                            'Improving your credit score',
                            'Managing multiple credit accounts',
                            'Negotiating better rates',
                            'Credit report monitoring'
                        ],
                        'duration': '1 hour'
                    }
                ],
                'estimated_time': '5 hours'
            }
        }

        path = learning_paths.get(literacy_level, learning_paths['intermediate'])

        # Get user's progress
        from .db_utils import get_learning_progress
        progress = await get_learning_progress(ctx.deps.db_pool, user_id)

        completed_modules = progress.get('completed_modules', [])

        # Find next lesson
        next_lesson = None
        for module in path['modules']:
            if module['title'] not in completed_modules:
                next_lesson = {
                    'module': module['title'],
                    'first_lesson': module['lessons'][0],
                    'duration': module['duration']
                }
                break

        return {
            'user_id': user_id,
            'learning_path': path['name'],
            'literacy_level': literacy_level,
            'modules': path['modules'],
            'estimated_completion_time': path['estimated_time'],
            'next_lesson': next_lesson or {
                'message': 'Congratulations! You have completed this learning path.',
                'recommendation': 'Consider moving to the next level or exploring advanced topics.'
            },
            'progress': {
                'completed_modules': len(completed_modules),
                'total_modules': len(path['modules']),
                'completion_percentage': (len(completed_modules) / len(path['modules']) * 100) if path['modules'] else 0
            }
        }

    except Exception as e:
        logger.error(f"Learning path generation failed: {e}")
        return {
            'error': str(e),
            'learning_path': 'unavailable'
        }


@mentor_agent.tool
async def explain_financial_concept(
    ctx: RunContext[MentorDependencies],
    concept: str,
    user_level: str = 'basic'
) -> Dict[str, Any]:
    """
    Explain financial concepts in simple terms (Namibian context).

    Concepts include:
    - Interest rates
    - Credit scores
    - NAD currency
    - Budgeting
    - Savings
    - Loans
    - Investments
    - Tax
    - Insurance
    - Inflation

    Args:
        concept: Financial concept to explain
        user_level: User's literacy level ('basic', 'intermediate', 'advanced')

    Returns:
        {
            'concept': str,
            'simple_explanation': str,
            'detailed_explanation': str,
            'namibian_context': str,
            'example': str,
            'related_concepts': list
        }
    """
    try:
        # Financial concept definitions (Namibian context)
        concepts = {
            'interest_rate': {
                'simple': "Interest rate is the extra money you pay when you borrow, or earn when you save. It's shown as a percentage.",
                'detailed': "An interest rate is the cost of borrowing money, expressed as a percentage of the principal amount. When you take a Buffr Lend loan (NAD 500-10,000), you pay interest on top of the borrowed amount. Similarly, when you save money, the bank pays you interest.",
                'namibian': "In Namibia, Buffr Lend offers loans at 8-20% APR depending on your credit tier. The Bank of Namibia sets the repo rate, which influences lending rates across Namibian financial institutions.",
                'example': "If you borrow NAD 1,000 at 12% annual interest for one year, you'll pay NAD 120 in interest (NAD 1,000 × 0.12 = NAD 120).",
                'related': ['credit_score', 'loan', 'apr', 'savings']
            },
            'credit_score': {
                'simple': "Your credit score is like a grade for how well you manage money. A good score helps you get better loans.",
                'detailed': "A credit score (300-850) measures your creditworthiness based on your payment history, debt levels, and financial behavior. Buffr calculates your score to determine loan eligibility and interest rates.",
                'namibian': "In Namibia, credit bureaus track your financial behavior. Buffr uses this data plus your Buffr transaction history to create a comprehensive credit assessment. Excellent credit (700+) qualifies you for NAD 10,000 loans at 8% APR.",
                'example': "If you always pay bills on time and keep your Buffr balance positive, your credit score improves. Late payments or defaulting on loans will lower your score.",
                'related': ['interest_rate', 'loan', 'credit_tier', 'buffr_lend']
            },
            'budgeting': {
                'simple': "Budgeting means planning how to spend your money each month so you don't run out before month-end.",
                'detailed': "Budgeting is the process of creating a plan for your income and expenses. It helps you allocate money to necessities, savings, and discretionary spending while avoiding debt.",
                'namibian': "With Buffr's spending analysis, you can track expenses by category (Food, Transport, Bills, etc.) and create personalized budgets based on your income and spending patterns.",
                'example': "Monthly income: NAD 5,000. Budget: Housing (NAD 2,000), Food (NAD 1,000), Transport (NAD 500), Savings (NAD 750), Other (NAD 750).",
                'related': ['savings', 'spending_categories', 'emergency_fund']
            },
            'nad_currency': {
                'simple': "NAD (Namibian Dollar) is Namibia's official currency. It's pegged 1:1 to the South African Rand (ZAR).",
                'detailed': "The Namibian Dollar (NAD) has been Namibia's currency since 1993. It's pegged to the South African Rand, meaning NAD 1 = ZAR 1. Both currencies are accepted in Namibia.",
                'namibian': "The Bank of Namibia manages monetary policy and exchange rates. You can exchange NAD for other currencies at rates set by the Bank of Namibia, typically around NAD 18.50 per USD.",
                'example': "NAD 100 = ZAR 100 (always). NAD 100 = approximately USD 5.40 (varies daily).",
                'related': ['exchange_rates', 'bon', 'inflation']
            },
            'savings': {
                'simple': "Savings is money you set aside for future needs instead of spending it now. It helps you prepare for emergencies.",
                'detailed': "Savings involves systematically setting aside a portion of your income for future goals, emergencies, or investments. Financial experts recommend saving 10-20% of your income.",
                'namibian': "Buffr can help you automatically save by setting up savings goals and auto-save rules. Many Namibians save informally, but formal savings with Buffr provide better security and tracking.",
                'example': "Save NAD 500/month for 12 months = NAD 6,000 emergency fund. This covers unexpected expenses like medical bills or car repairs.",
                'related': ['emergency_fund', 'savings_goals', 'interest_rate']
            },
            'loan': {
                'simple': "A loan is money you borrow and promise to pay back later, usually with interest added.",
                'detailed': "A loan is a sum of money borrowed from a lender (like Buffr Lend) that must be repaid over time with interest. Loan terms specify the amount, interest rate, repayment schedule, and consequences of default.",
                'namibian': "Buffr Lend offers microloans from NAD 500 to NAD 10,000 based on your credit tier. Interest rates range from 8% (excellent credit) to 20% (poor credit). Loans help merchants manage cash flow.",
                'example': "Borrow NAD 2,000 at 16% APR for 6 months. Monthly payment: NAD 350. Total repayment: NAD 2,100 (NAD 100 interest).",
                'related': ['interest_rate', 'credit_score', 'buffr_lend', 'default']
            }
        }

        concept_key = concept.lower().replace(' ', '_')
        concept_data = concepts.get(concept_key)

        if not concept_data:
            # Generate general explanation
            return {
                'concept': concept,
                'simple_explanation': f"I don't have specific information about '{concept}' yet, but I can help you understand it. Please ask the Mentor Agent for more details.",
                'detailed_explanation': '',
                'namibian_context': '',
                'example': '',
                'related_concepts': []
            }

        # Adjust explanation based on user level
        if user_level == 'basic':
            explanation = concept_data['simple']
        elif user_level == 'advanced':
            explanation = f"{concept_data['detailed']} {concept_data['namibian']}"
        else:  # intermediate
            explanation = concept_data['detailed']

        return {
            'concept': concept,
            'simple_explanation': concept_data['simple'],
            'detailed_explanation': concept_data['detailed'],
            'namibian_context': concept_data['namibian'],
            'example': concept_data['example'],
            'related_concepts': concept_data['related']
        }

    except Exception as e:
        logger.error(f"Concept explanation failed: {e}")
        return {
            'error': str(e),
            'concept': concept
        }


@mentor_agent.tool
async def set_financial_goal(
    ctx: RunContext[MentorDependencies],
    user_id: str,
    goal_name: str,
    target_amount: float,
    target_date: str,
    category: str = 'savings'
) -> Dict[str, Any]:
    """
    Help user set and track financial goals.

    Goal categories:
    - savings (emergency fund, vacation, purchase)
    - debt_repayment (pay off loan, credit card)
    - investment (start investing, retirement)
    - education (save for school, training)

    Args:
        user_id: User identifier
        goal_name: Name of the goal (e.g., "Emergency Fund")
        target_amount: Goal amount in NAD
        target_date: Target completion date (YYYY-MM-DD)
        category: Goal category

    Returns:
        {
            'goal_id': str,
            'goal_name': str,
            'target_amount': float,
            'monthly_savings_needed': float,
            'achievability': str,
            'recommendations': list,
            'milestones': list
        }
    """
    try:
        from datetime import datetime, timedelta
        from .db_utils import create_financial_goal, get_user_avg_monthly_income

        # Calculate months until target
        target = datetime.fromisoformat(target_date.split('T')[0])
        months_remaining = max(1, (target.year - datetime.now().year) * 12 + target.month - datetime.now().month)

        monthly_needed = target_amount / months_remaining

        # Get user's average income to assess achievability
        avg_income = await get_user_avg_monthly_income(ctx.deps.db_pool, user_id)

        if avg_income > 0:
            savings_rate = (monthly_needed / avg_income) * 100

            if savings_rate <= 10:
                achievability = 'very_achievable'
                recommendations = [
                    f"Excellent goal! Only {savings_rate:.1f}% of your monthly income.",
                    "Set up automatic savings to make this effortless."
                ]
            elif savings_rate <= 20:
                achievability = 'achievable'
                recommendations = [
                    f"Good goal requiring {savings_rate:.1f}% of monthly income.",
                    "Review your budget to find NAD {monthly_needed:.2f}/month.",
                    "Consider using Buffr's auto-save feature."
                ]
            elif savings_rate <= 30:
                achievability = 'challenging'
                recommendations = [
                    f"Ambitious goal requiring {savings_rate:.1f}% of monthly income.",
                    f"This means saving NAD {monthly_needed:.2f}/month.",
                    "Review expenses to find cost-cutting opportunities.",
                    "Consider extending the timeline or reducing the target."
                ]
            else:
                achievability = 'very_challenging'
                recommendations = [
                    f"Very ambitious - requires {savings_rate:.1f}% of monthly income.",
                    f"Need to save NAD {monthly_needed:.2f}/month.",
                    "Strongly recommend adjusting target amount or timeline.",
                    "Focus on increasing income or reducing expenses."
                ]
        else:
            achievability = 'unknown'
            recommendations = [
                f"You need to save NAD {monthly_needed:.2f}/month.",
                "Track your income with Buffr to get personalized guidance."
            ]

        # Create milestones (quarterly checkpoints)
        milestones = []
        milestone_months = [3, 6, 9, 12] if months_remaining >= 12 else [months_remaining // 2, months_remaining]

        for m in milestone_months:
            if m <= months_remaining:
                milestone_amount = (target_amount / months_remaining) * m
                milestones.append({
                    'month': m,
                    'target_amount': round(milestone_amount, 2),
                    'description': f"Month {m}: Save NAD {milestone_amount:.2f}"
                })

        # Store goal in database
        goal_id = await create_financial_goal(
            ctx.deps.db_pool,
            user_id,
            goal_name,
            target_amount,
            target_date,
            category
        )

        return {
            'goal_id': goal_id,
            'user_id': user_id,
            'goal_name': goal_name,
            'target_amount': float(target_amount),
            'target_date': target_date,
            'months_remaining': months_remaining,
            'monthly_savings_needed': float(monthly_needed),
            'achievability': achievability,
            'recommendations': recommendations,
            'milestones': milestones,
            'category': category
        }

    except Exception as e:
        logger.error(f"Goal setting failed: {e}")
        return {
            'error': str(e),
            'goal_name': goal_name
        }


@mentor_agent.tool
async def get_fraud_prevention_tips(
    ctx: RunContext[MentorDependencies],
    risk_level: str = 'general'
) -> List[str]:
    """
    Get fraud prevention and security tips.

    Based on GSMA DFL toolkit consumer protection guidelines.

    Risk levels:
    - general: Basic security practices
    - elevated: Enhanced protection (after suspicious activity)
    - critical: Immediate action needed (after fraud detection)

    Args:
        risk_level: Level of fraud risk

    Returns:
        List of actionable fraud prevention tips
    """
    try:
        tips = {
            'general': [
                "🔒 Never share your Buffr PIN or password with anyone - not even family",
                "📱 Always verify recipient details before sending money",
                "🛡️ Use biometric authentication (fingerprint/face) when available",
                "💳 Check your transaction history regularly for unauthorized activity",
                "🚫 Buffr will never call/SMS asking for your full PIN or password",
                "✅ Only download Buffr from official app stores (Google Play/App Store)",
                "🔐 Create a strong PIN using numbers that aren't easy to guess (not birthdays)",
                "📞 If something feels suspicious, contact Buffr support immediately",
                "💰 Be cautious of 'too good to be true' investment opportunities",
                "🎯 Verify merchant credentials before making large payments"
            ],
            'elevated': [
                "⚠️ Change your Buffr PIN immediately if you suspect it's compromised",
                "🔍 Review all recent transactions for unauthorized activity",
                "📧 Be extra cautious of phishing emails/SMS claiming to be from Buffr",
                "🚨 Enable all available security features (2FA, biometrics)",
                "💬 Don't respond to unsolicited messages asking for account information",
                "📱 Ensure your phone has up-to-date security software",
                "🔒 Log out of Buffr when using shared or public devices",
                "👤 Report suspicious contacts claiming to be from Buffr",
                "💳 Consider temporary transaction limits until risk is resolved",
                "📞 Contact Buffr support to report suspicious activity: support@buffr.com"
            ],
            'critical': [
                "🚨 URGENT: Change your PIN and password immediately",
                "📞 Call Buffr fraud hotline immediately: [insert number]",
                "🔒 Lock your account if you suspect unauthorized access",
                "💳 Review and dispute any unauthorized transactions",
                "📱 Check for unauthorized devices logged into your account",
                "🏦 Contact your bank if linked cards are compromised",
                "👮 File a police report for identity theft or fraud",
                "📧 Forward phishing emails to: fraud@buffr.com",
                "💰 Freeze all active loans or credit until resolved",
                "📋 Monitor your credit report for unauthorized accounts",
                "🛡️ Enable maximum security settings",
                "⚖️ Document all fraudulent activity with screenshots",
                "🔄 Update recovery email and phone number",
                "👥 Warn contacts who may have received fraudulent messages from you"
            ]
        }

        return tips.get(risk_level, tips['general'])

    except Exception as e:
        logger.error(f"Fraud tips generation failed: {e}")
        return [
            "Failed to load fraud prevention tips. Please contact Buffr support.",
            f"Error: {str(e)}"
        ]


@mentor_agent.tool
async def track_learning_progress(
    ctx: RunContext[MentorDependencies],
    user_id: str
) -> Dict[str, Any]:
    """
    Track user's financial literacy learning progress.

    Args:
        user_id: User identifier

    Returns:
        {
            'current_level': str,
            'modules_completed': int,
            'total_modules': int,
            'skills_acquired': list,
            'next_steps': list,
            'achievements': list
        }
    """
    try:
        from .db_utils import get_learning_progress, get_literacy_assessment

        # Get latest assessment
        assessment = await get_literacy_assessment(ctx.deps.db_pool, user_id)

        # Get progress data
        progress = await get_learning_progress(ctx.deps.db_pool, user_id)

        completed_modules = progress.get('completed_modules', [])
        skills_acquired = progress.get('skills_acquired', [])

        # Calculate achievements
        achievements = []
        if len(completed_modules) >= 1:
            achievements.append("🎓 Started your learning journey")
        if len(completed_modules) >= 3:
            achievements.append("📚 Completed 3 modules")
        if assessment and assessment.get('overall_score', 0) > 0.7:
            achievements.append("⭐ Achieved advanced literacy level")
        if 'fraud_prevention' in skills_acquired:
            achievements.append("🛡️ Fraud prevention expert")
        if 'budgeting' in skills_acquired:
            achievements.append("💰 Budgeting master")

        return {
            'user_id': user_id,
            'current_level': assessment.get('literacy_level', 'basic') if assessment else 'basic',
            'overall_score': assessment.get('overall_score', 0) if assessment else 0,
            'modules_completed': len(completed_modules),
            'completed_module_names': completed_modules,
            'skills_acquired': skills_acquired,
            'achievements': achievements,
            'next_steps': [
                "Continue with your personalized learning path",
                "Practice what you've learned with Buffr features",
                "Set a financial goal and track your progress"
            ]
        }

    except Exception as e:
        logger.error(f"Progress tracking failed: {e}")
        return {
            'error': str(e),
            'user_id': user_id
        }
