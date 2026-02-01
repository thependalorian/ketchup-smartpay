/**
 * Layout Components Index
 * 
 * Location: components/layouts/index.ts
 * Purpose: Central export for reusable layout components
 */

export { default as StandardScreenLayout } from './StandardScreenLayout';
export { default as ModalSheetLayout } from './ModalSheetLayout';
export { default as MultiStepLayout } from './MultiStepLayout';
export { default as DetailViewLayout } from './DetailViewLayout';
export { default as ListViewLayout } from './ListViewLayout';

// Re-export layout constants from centralized location
export { HORIZONTAL_PADDING, SECTION_SPACING, LARGE_SECTION_SPACING, CARD_GAP } from '@/constants/Layout';
