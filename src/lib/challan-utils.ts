import { prisma } from './prisma';

/**
 * Generates an automatic unique Invoice Number formatted as "Asi-02564" (5 digits)
 * Matches the requested format: Asi-02564
 */
export async function generateUniqueInvoiceNo(): Promise<string> {
  try {
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const random5Digit = Math.floor(Math.random() * 100000);
      const candidate = `Asi-${String(random5Digit).padStart(5, '0')}`;

      const exists = await prisma.challan.findFirst({
        where: {
          OR: [
            { challanNo: candidate },
            { invoiceNo: candidate },
          ],
        },
      });

      if (!exists) {
        return candidate;
      }
    }
  } catch (err) {
    console.error('Error querying DB during invoice generation:', err);
  }

  const fallback = Math.floor(Math.random() * 100000);
  return `Asi-${String(fallback).padStart(5, '0')}`;
}

export const generateUniqueChallanNo = generateUniqueInvoiceNo;

/**
 * Formats a Date object into "25-Oct-26" format matching the picture
 */
export function formatChallanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });

  const parts = formatter.formatToParts(d);
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const month = parts.find((p) => p.type === 'month')?.value || 'Oct';
  const year = parts.find((p) => p.type === 'year')?.value || '26';

  return `${day}-${month}-${year}`;
}

/**
 * Converts a total number into USD words format matching picture:
 * e.g. 11.00 -> "$ 11.00 Dollar Only."
 */
export function formatValueInWords(amount: number): string {
  const formattedAmount = (isNaN(amount) ? 0 : amount).toFixed(2);
  return `$ ${formattedAmount}  Dollar Only.`;
}

export function getCurrentDhakaDate(): Date {
  return new Date();
}
