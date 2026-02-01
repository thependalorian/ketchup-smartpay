/**
 * Step Indicator Component
 *
 * Location: components/common/StepIndicator.tsx
 * Purpose: Visual step indicator for multi-step flows
 *
 * Features:
 * - Dots or progress bar style
 * - Current step highlighting
 * - Completed step indication
 * - Step labels (optional)
 * - Progress percentage
 *
 * @psychology
 * - **Goal-Gradient Effect**: As users progress through steps, they become
 *   more motivated to complete. Visual progress creates momentum and reduces
 *   abandonment. Consider animating step completion for celebration.
 * - **Miller's Law**: Limit to 5-7 steps maximum. More steps overwhelm users
 *   and increase cognitive load. Break complex flows into logical groups.
 * - **Serial Position Effect**: First and last steps are most memorable.
 *   Place critical actions (review, confirm) at the end for recency effect.
 * - **Cognitive Load**: Step labels provide context and reduce uncertainty.
 *   Users know what's coming and can mentally prepare.
 * - **Von Restorff Effect**: Current step should stand out visually (filled
 *   vs unfilled dots, highlighted color) to show exact position in flow.
 *
 * @enhancement
 * - Add haptic feedback when completing steps
 * - Animate progress bar fill for visual momentum
 * - Consider "confetti" celebration on final step
 *
 * @see wireframes for multi-step flow patterns
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface Step {
  title?: string;
  isComplete?: boolean;
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: Step[];
  style?: 'dots' | 'progress';
  showLabels?: boolean;
  showProgress?: boolean;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  steps,
  style = 'dots',
  showLabels = false,
  showProgress = false,
}: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  if (style === 'progress') {
    return (
      <View style={styles.container}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%` },
              ]}
            />
          </View>
          {showProgress && (
            <Text style={styles.progressText}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
        {showLabels && steps && (
          <View style={styles.labelsContainer}>
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isComplete = stepNumber < currentStep;

              return (
                <Text
                  key={stepNumber}
                  style={[
                    styles.label,
                    isActive && styles.labelActive,
                    isComplete && styles.labelComplete,
                  ]}
                >
                  {step.title || `Step ${stepNumber}`}
                </Text>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  // Dots style
  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;

          return (
            <View
              key={stepNumber}
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isComplete && styles.dotComplete,
              ]}
            />
          );
        })}
      </View>
      {showLabels && steps && (
        <View style={styles.labelsContainer}>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;

            return (
              <Text
                key={stepNumber}
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                ]}
              >
                {step.title || `Step ${stepNumber}`}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  dotComplete: {
    backgroundColor: Colors.success,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  labelComplete: {
    color: Colors.success,
  },
});
