/**
 * Print Commands - Reusable Bill Printing System
 *
 * This module provides a complete, modular bill printing system that can be used
 * throughout your restaurant management application.
 */

// Main print commands class and types
export {
  PrintCommands,
  printCommands,
  type BillData,
  type BillItem,
  type AdditionalCharge,
  type RestaurantSettings,
} from './printCommands';

// Ready-to-use functions for common scenarios
export {
  printAndSaveBill,
  printDraftBill,
  quickPrintBill,
  getBillPreview,
} from './printCommandsExample';
