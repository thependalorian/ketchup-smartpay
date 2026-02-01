/**
 * Multi-Step Layout Component
 * 
 * Location: components/layouts/MultiStepLayout.tsx
 * Purpose: Reusable layout wrapper for multi-step flows (Send Money, Request Money, Onboarding)
 * 
 * Features:
 * - Step indicator (dots or progress bar)
 * - Step navigation (Next/Back buttons)
 * - Step validation
 * - Progress tracking
 * - Real estate planning
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import ScreenHeader from '@/components/common/ScreenHeader';
import PillButton from '@/components/common/PillButton';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

interface Step {
  title?: string;
  isComplete?: boolean;
}

interface MultiStepLayoutProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  steps?: Step[];
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  showStepIndicator?: boolean;
  showStepLabels?: boolean;
  scrollContentStyle?: any;
  keyboardAvoiding?: boolean;
  nextDisabled?: boolean;
  showNextButton?: boolean;
  showPreviousButton?: boolean;
}

export default function MultiStepLayout({
  title,
  currentStep,
  totalSteps,
  steps,
  children,
  onBack,
  onNext,
  onPrevious,
  nextLabel = 'Next',
  previousLabel = 'Back',
  showStepIndicator = true,
  showStepLabels = false,
  scrollContentStyle,
  keyboardAvoiding = true,
  nextDisabled = false,
  showNextButton = true,
  showPreviousButton = true,
}: MultiStepLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const content = (
    <View style={defaultStyles.container}>
      <ScreenHeader
        title={title}
        showBackButton={!!onBack}
        onBack={onBack}
      />

      {/* Step Indicator */}
      {showStepIndicator && (
        <View style={styles.stepIndicatorContainer}>
          {/* Progress Bar Style */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
          </View>

          {/* Step Dots */}
          <View style={styles.stepDotsContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isComplete = stepNumber < currentStep;

              return (
                <View
                  key={stepNumber}
                  style={[
                    styles.stepDot,
                    isActive && styles.stepDotActive,
                    isComplete && styles.stepDotComplete,
                  ]}
                />
              );
            })}
          </View>

          {/* Step Labels (Optional) */}
          {showStepLabels && steps && (
            <View style={styles.stepLabelsContainer}>
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;

                return (
                  <Text
                    key={stepNumber}
                    style={[
                      styles.stepLabel,
                      isActive && styles.stepLabelActive,
                    ]}
                  >
                    {step.title || `Step ${stepNumber}`}
                  </Text>
                );
              })}
            </View>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          scrollContentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {showPreviousButton && !isFirstStep && (
          <PillButton
            label={previousLabel}
            variant="outline"
            onPress={onPrevious || onBack}
            style={styles.navigationButton}
          />
        )}
        {showNextButton && (
          <PillButton
            label={isLastStep ? 'Confirm' : nextLabel}
            variant="primary"
            onPress={onNext}
            disabled={nextDisabled}
            style={[
              styles.navigationButton,
              !showPreviousButton || isFirstStep
                ? styles.navigationButtonFull
                : undefined,
            ]}
          />
        )}
      </View>
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  stepIndicatorContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: SECTION_SPACING,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  stepDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: Colors.success,
  },
  stepLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: SECTION_SPACING * 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  navigationButton: {
    flex: 1,
  },
  navigationButtonFull: {
    flex: 1,
    marginLeft: 0,
  },
});
