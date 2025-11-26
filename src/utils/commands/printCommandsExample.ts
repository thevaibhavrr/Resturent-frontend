/**
 * Print Commands Usage Examples
 *
 * This file demonstrates how to use the printCommands for different bill printing scenarios.
 * Import this wherever you need bill printing functionality in your application.
 */

import { printCommands, type BillData } from './printCommands';
import { toast } from 'sonner';

/**
 * Example: Print & Save Bill (saves to database and prints)
 *
 * Use this function when you want to save the bill to the database first,
 * then print it. This is typically used for the "Save & Print" button.
 */
export async function printAndSaveBill(
  billData: BillData,
  saveBillFunction: (data: any) => Promise<any>,
  elementId?: string
): Promise<void> {
  try {
    // Save bill to database first
    const savedBill = await saveBillFunction({
      billNumber: billData.billNumber,
      tableName: billData.tableName,
      persons: billData.persons,
      items: billData.items,
      additionalCharges: billData.additionalCharges,
      discountAmount: billData.discountAmount,
      cgst: billData.cgst,
      sgst: billData.sgst,
      grandTotal: billData.grandTotal,
    });

    toast.success('Bill saved successfully!');

    // Then print the bill
    await printCommands.printAndSaveBill(billData, saveBillFunction, elementId);

  } catch (error) {
    console.error('Error in print and save:', error);
    toast.error('Failed to save and print bill');
    throw error;
  }
}

/**
 * Example: Print Draft Bill (prints without saving)
 *
 * Use this function when you want to print a bill preview without saving it to the database.
 * This is typically used for the "Print Draft" button.
 */
export async function printDraftBill(
  billData: BillData,
  elementId?: string
): Promise<void> {
  try {
    await printCommands.printDraftBill(billData, elementId);
  } catch (error) {
    console.error('Error printing draft bill:', error);
    toast.error('Failed to print draft bill');
    throw error;
  }
}

/**
 * Example: Quick Print (direct print without save)
 *
 * Use this for immediate printing without any database operations.
 * Useful for reprinting existing bills or quick previews.
 */
export async function quickPrintBill(
  billData: BillData,
  elementId?: string,
  useBluetooth: boolean = false
): Promise<void> {
  try {
    if (useBluetooth) {
      await printCommands.printBillViaBluetooth(billData);
    } else {
      await printCommands.printBillToPDF(billData, elementId);
    }
  } catch (error) {
    console.error('Error in quick print:', error);
    toast.error('Failed to print bill');
    throw error;
  }
}

/**
 * Example: Get Bill Preview HTML
 *
 * Use this to get the HTML content for displaying a bill preview
 * without actually printing it.
 */
export async function getBillPreview(billData: BillData): Promise<string> {
  try {
    return await printCommands.getBillPreviewHTML(billData);
  } catch (error) {
    console.error('Error getting bill preview:', error);
    throw error;
  }
}

/**
 * Example: Integration in React Components
 *
 * Here's how you would use these functions in your React components:
 */

/*
// In your BillPage component (for Save & Print button)
import { printAndSaveBill } from '../utils/commands/printCommandsExample';

const handleSaveAndPrint = async () => {
  if (cart.length === 0) {
    toast.error('Cart is empty');
    return;
  }

  try {
    const billData: BillData = {
      billNumber: `BILL-${Date.now()}`,
      tableName,
      persons,
      items: cart,
      additionalCharges,
      discountAmount: totalDiscount,
      cgst: 0, // Calculate as needed
      sgst: 0, // Calculate as needed
      grandTotal: total,
    };

    await printAndSaveBill(billData, persistBillHistory);
  } catch (error) {
    // Error is already handled in the function
  }
};

// In your BillPage component (for Print Draft button)
import { printDraftBill } from '../utils/commands/printCommandsExample';

const handlePrintDraft = async () => {
  if (cart.length === 0) {
    toast.error('Cart is empty');
    return;
  }

  try {
    const billData: BillData = {
      billNumber: `DRAFT-${Date.now()}`,
      tableName,
      persons,
      items: cart,
      additionalCharges,
      discountAmount: totalDiscount,
      cgst: 0,
      sgst: 0,
      grandTotal: total,
    };

    await printDraftBill(billData);
  } catch (error) {
    // Error is already handled in the function
  }
};

// In any component (for quick printing)
import { quickPrintBill } from '../utils/commands/printCommandsExample';

const handleQuickPrint = async () => {
  const billData: BillData = { ... }; // Your bill data
  await quickPrintBill(billData, 'bill-element-id', false); // Regular print
  // or
  await quickPrintBill(billData, undefined, true); // Bluetooth print
};
*/

/**
 * Example: Integration with Navigation
 *
 * If you want to navigate to a print page after saving:
 */

/*
// In your page component
import { useNavigate } from 'react-router-dom';
import { printAndSaveBill } from '../utils/commands/printCommandsExample';

const navigate = useNavigate();

const handleSaveAndPrintWithNavigation = async (billData: BillData) => {
  try {
    await printAndSaveBill(billData, async (data) => {
      // Save to database
      const savedBill = await saveBillToDatabase(data);

      // Navigate to print page
      navigate('/print-bill', {
        state: {
          ...data,
          billId: savedBill.id
        }
      });

      return savedBill;
    });
  } catch (error) {
    // Handle error
  }
};
*/

export {
  // Re-export types for convenience
  type BillData,
} from './printCommands';
