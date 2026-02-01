/**
 * Mentor Agent - Financial Education
 * 
 * Financial literacy assessment, learning paths, and education
 */

import { MentorResponse, LearningResource, ProgressUpdate } from '../../types/index.js';
import { chatCompletion } from '../../utils/providers.js';
import {
  MENTOR_SYSTEM_PROMPT,
  ASSESSMENT_PROMPT,
  LEARNING_PATH_PROMPT,
  CONCEPT_EXPLANATION_PROMPT,
  GOAL_SETTING_PROMPT,
  FRAUD_TIPS_PROMPT,
} from './prompts.js';

// ==================== Learning Content ====================

export const LEARNING_MODULES = {
  level1: {
    name: 'Foundations',
    topics: [
      { id: 'money-basics', title: 'What is Money?', duration: '10 min', type: 'article' as const },
      { id: 'banking-101', title: 'Banking Basics', duration: '15 min', type: 'article' as const },
      { id: 'budgeting-intro', title: 'Introduction to Budgeting', duration: '20 min', type: 'video' as const },
      { id: 'understanding-statements', title: 'Reading Bank Statements', duration: '10 min', type: 'exercise' as const },
      { id: 'level1-quiz', title: 'Foundations Quiz', duration: '5 min', type: 'quiz' as const },
    ],
  },
  level2: {
    name: 'Building Blocks',
    topics: [
      { id: 'savings-strategies', title: 'Savings Strategies', duration: '15 min', type: 'article' as const },
      { id: 'emergency-fund', title: 'Building Emergency Fund', duration: '10 min', type: 'article' as const },
      { id: 'interest-explained', title: 'Understanding Interest', duration: '20 min', type: 'video' as const },
      { id: 'credit-basics', title: 'Credit Score & Loans', duration: '25 min', type: 'article' as const },
      { id: 'insurance-101', title: 'Insurance Fundamentals', duration: '15 min', type: 'article' as const },
    ],
  },
  level3: {
    name: 'Growth',
    topics: [
      { id: 'investing-intro', title: 'Investment Basics', duration: '30 min', type: 'video' as const },
      { id: 'stocks-bonds', title: 'Stocks vs Bonds', duration: '20 min', type: 'article' as const },
      { id: 'retirement-planning', title: 'Planning for Retirement', duration: '25 min', type: 'article' as const },
      { id: 'tax-basics', title: 'Tax Basics for Namibians', duration: '20 min', type: 'article' as const },
      { id: 'property-basics', title: 'Property Investment', duration: '20 min', type: 'article' as const },
    ],
  },
  level4: {
    name: 'Advanced',
    topics: [
      { id: 'portfolio-diversification', title: 'Portfolio Diversification', duration: '30 min', type: 'article' as const },
      { id: 'business-finance', title: 'Business Finance Basics', duration: '40 min', type: 'video' as const },
      { id: 'estate-planning', title: 'Estate Planning', duration: '25 min', type: 'article' as const },
      { id: 'wealth-building', title: 'Wealth Building Strategies', duration: '35 min', type: 'video' as const },
    ],
  },
};

export const FINANCIAL_CONCEPTS = {
  'compound-interest': {
    title: 'Compound Interest',
    simple: 'Interest earned on interest - your money growing on itself',
    level: 2,
  },
  'inflation': {
    title: 'Inflation',
    simple: 'When prices go up over time, reducing what your money can buy',
    level: 1,
  },
  'credit-score': {
    title: 'Credit Score',
    simple: 'A number that shows how reliable you are at repaying borrowed money',
    level: 2,
  },
  'diversification': {
    title: 'Diversification',
    simple: 'Not putting all your eggs in one basket - spreading investments to reduce risk',
    level: 3,
  },
  'budgeting': {
    title: 'Budgeting',
    simple: 'Planning how to spend your money before you spend it',
    level: 1,
  },
  'emergency-fund': {
    title: 'Emergency Fund',
    simple: 'Savings set aside for unexpected expenses (3-6 months of living costs)',
    level: 1,
  },
};

// ==================== Assessment Questions ====================

const ASSESSMENT_QUESTIONS = [
  {
    id: 'q1',
    question: 'What is the main purpose of a budget?',
    options: [
      'To restrict spending',
      'To plan and track income and expenses',
      'To save every penny',
      'To avoid spending money',
    ],
    correct: 1,
    level: 1,
  },
  {
    id: 'q2',
    question: 'What is compound interest?',
    options: [
      'Interest charged on loans only',
      'A type of bank account',
      'Interest earned on both principal and previously earned interest',
      'A government tax',
    ],
    correct: 2,
    level: 2,
  },
  {
    id: 'q3',
    question: 'How much should an emergency fund typically cover?',
    options: [
      '1 week of expenses',
      '1 month of expenses',
      '3-6 months of expenses',
      '1 year of expenses',
    ],
    correct: 2,
    level: 2,
  },
  {
    id: 'q4',
    question: 'What does diversification mean in investing?',
    options: [
      'Investing all money in one stock',
      'Spreading investments across different assets to reduce risk',
      'Only investing in bank savings',
      'Avoiding investments entirely',
    ],
    correct: 1,
    level: 3,
  },
];

// ==================== Mentor Agent Functions ====================

/**
 * Assess user's financial literacy level
 */
export async function assessFinancialLiteracy(
  answers?: Record<string, number>
): Promise<MentorResponse> {
  let score = 0;
  let maxScore = 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  if (answers) {
    for (const question of ASSESSMENT_QUESTIONS) {
      maxScore++;
      if (answers[question.id] === question.correct) {
        score++;
        if (question.level === 1) strengths.push('Basic financial concepts');
        if (question.level === 2) strengths.push('Intermediate knowledge');
        if (question.level === 3) strengths.push('Advanced understanding');
      } else {
        if (question.level === 1) improvements.push('Foundation concepts');
        if (question.level === 2) improvements.push('Building blocks');
        if (question.level === 3) improvements.push('Growth strategies');
      }
    }
  }
  
  // Calculate level
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const level = percentage >= 75 ? 4 : percentage >= 50 ? 3 : percentage >= 25 ? 2 : 1;
  
  // Get AI assessment
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT },
    { role: 'user', content: ASSESSMENT_PROMPT(answers) },
  ];
  
  const aiAssessment = await chatCompletion(messages);
  
  // Build response
  const resources: LearningResource[] = [];
  const levelModules = LEARNING_MODULES[`level${level}` as keyof typeof LEARNING_MODULES];
  
  if (levelModules) {
    resources.push(...levelModules.topics.slice(0, 3).map(t => ({
      title: t.title,
      type: t.type,
      duration: t.duration,
      difficulty: level === 1 ? 'beginner' as const : level === 2 ? 'intermediate' as const : 'advanced' as const,
    })));
  }
  
  const progressUpdate: ProgressUpdate = {
    currentLevel: level,
    totalLevels: 4,
    completedTopics: [],
    nextTopics: resources.map(r => r.title),
    achievements: score > 0 ? ['Assessment Complete 🎯'] : [],
  };
  
  return {
    type: 'assessment',
    content: aiAssessment,
    resources,
    progressUpdate,
  };
}

/**
 * Generate personalized learning path
 */
export async function generateLearningPath(
  userProfile: {
    currentLevel?: number;
    completedTopics?: string[];
    goals?: string[];
    availableTime?: string;
    learningStyle?: string;
  }
): Promise<MentorResponse> {
  const level = userProfile.currentLevel || 1;
  const completedTopics = userProfile.completedTopics || [];
  
  // Get all topics for current and next levels
  const currentModule = LEARNING_MODULES[`level${level}` as keyof typeof LEARNING_MODULES];
  const nextModule = LEARNING_MODULES[`level${Math.min(level + 1, 4)}` as keyof typeof LEARNING_MODULES];
  
  // Filter out completed topics
  const availableTopics = [
    ...(currentModule?.topics || []),
    ...(nextModule?.topics || []),
  ].filter(t => !completedTopics.includes(t.id));
  
  // Build learning resources
  const resources: LearningResource[] = availableTopics.slice(0, 5).map(t => ({
    title: t.title,
    type: t.type,
    duration: t.duration,
    difficulty: level === 1 ? 'beginner' as const : level === 2 ? 'intermediate' as const : 'advanced' as const,
  }));
  
  // Get AI recommendations
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT },
    { role: 'user', content: LEARNING_PATH_PROMPT(userProfile) },
  ];
  
  const aiPath = await chatCompletion(messages);
  
  const progressUpdate: ProgressUpdate = {
    currentLevel: level,
    totalLevels: 4,
    completedTopics,
    nextTopics: resources.map(r => r.title),
    achievements: completedTopics.length >= 5 ? ['Fast Learner 📚'] : [],
  };
  
  return {
    type: 'learning_path',
    content: aiPath,
    resources,
    progressUpdate,
  };
}

/**
 * Explain a financial concept
 */
export async function explainConcept(
  concept: string,
  userLevel: number = 1
): Promise<MentorResponse> {
  // Get AI explanation
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT },
    { role: 'user', content: CONCEPT_EXPLANATION_PROMPT(concept, userLevel) },
  ];
  
  const explanation = await chatCompletion(messages);
  
  // Find related resources
  const resources: LearningResource[] = [];
  const conceptKey = concept.toLowerCase().replace(/\s+/g, '-');
  
  if (FINANCIAL_CONCEPTS[conceptKey as keyof typeof FINANCIAL_CONCEPTS]) {
    const conceptInfo = FINANCIAL_CONCEPTS[conceptKey as keyof typeof FINANCIAL_CONCEPTS];
    const levelModule = LEARNING_MODULES[`level${conceptInfo.level}` as keyof typeof LEARNING_MODULES];
    if (levelModule) {
      resources.push(...levelModule.topics.slice(0, 2).map(t => ({
        title: t.title,
        type: t.type,
        duration: t.duration,
        difficulty: conceptInfo.level === 1 ? 'beginner' as const : 'intermediate' as const,
      })));
    }
  }
  
  return {
    type: 'concept',
    content: explanation,
    resources,
  };
}

/**
 * Help set a financial goal
 */
export async function setFinancialGoal(goalInfo: {
  type?: string;
  targetAmount?: number;
  timeframe?: string;
  currentSavings?: number;
  monthlyIncome?: number;
}): Promise<MentorResponse> {
  // Get AI goal planning
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT },
    { role: 'user', content: GOAL_SETTING_PROMPT(goalInfo) },
  ];
  
  const goalPlan = await chatCompletion(messages);
  
  // Calculate milestones
  const targetAmount = goalInfo.targetAmount || 0;
  const currentSavings = goalInfo.currentSavings || 0;
  const remaining = targetAmount - currentSavings;
  
  const resources: LearningResource[] = [
    {
      title: 'Goal-Based Saving Strategies',
      type: 'article',
      duration: '10 min',
      difficulty: 'beginner',
    },
    {
      title: 'Tracking Your Progress',
      type: 'exercise',
      duration: '5 min',
      difficulty: 'beginner',
    },
  ];
  
  return {
    type: 'goal',
    content: goalPlan,
    resources,
    progressUpdate: {
      currentLevel: 1,
      totalLevels: 4,
      completedTopics: [],
      nextTopics: ['Set first milestone', `Save NAD ${Math.round(remaining / 4)}`],
      achievements: ['Goal Setter 🎯'],
    },
  };
}

/**
 * Provide fraud prevention tips
 */
export async function getFraudTips(scenario?: string): Promise<MentorResponse> {
  // Get AI tips
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT },
    { role: 'user', content: FRAUD_TIPS_PROMPT(scenario) },
  ];
  
  const tips = await chatCompletion(messages);
  
  return {
    type: 'tips',
    content: tips,
    resources: [
      {
        title: 'Recognizing Financial Scams',
        type: 'article',
        duration: '15 min',
        difficulty: 'beginner',
      },
      {
        title: 'Secure Banking Practices',
        type: 'video',
        duration: '10 min',
        difficulty: 'beginner',
      },
    ],
  };
}

/**
 * Get user's learning progress
 */
export async function getLearningProgress(userId: string): Promise<ProgressUpdate> {
  // In production, this would fetch from database
  // For now, return mock progress
  return {
    currentLevel: 2,
    totalLevels: 4,
    completedTopics: ['money-basics', 'banking-101', 'budgeting-intro'],
    nextTopics: ['understanding-statements', 'savings-strategies'],
    achievements: ['First Steps 🎉', 'Week Streak 🔥'],
  };
}

/**
 * Chat with Mentor agent
 */
export async function mentorChat(message: string): Promise<string> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];
  
  return chatCompletion(messages);
}
