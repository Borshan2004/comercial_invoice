import ExcelJS from 'exceljs';
import { formatChallanDate } from './challan-utils';

export interface CommercialInvoiceExportData {
  challanNo: string;
  invoiceNo?: string | null;
  awbNo?: string | null;
  totalWeight?: string | null;
  date: Date | string;

  shipperCompany: string;
  shipperAttn?: string | null;
  shipperAddress: string;
  shipperCity: string;
  shipperPostalCode: string;
  shipperCountry: string;
  shipperPhone: string;
  shipperEmail: string;

  manufCompany: string;
  manufAddress: string;
  manufCity: string;
  manufPostalCode: string;
  manufCountry: string;

  name: string; // consignee company
  address: string;
  consigneeAttn?: string | null;
  consigneeCity?: string | null;
  consigneePostal?: string | null;
  consigneeCountry?: string | null;
  consigneePhone?: string | null;
  consigneeEmail?: string | null;
  consigneeTaxId?: string | null;

  countryOfOrigin: string;
  midCode: string;
  purpose: string;
  totalValueInWords?: string | null;
  totalAmountUsd: number;
  notes?: string | null;

  items: {
    slNo: number;
    particular: string;
    harmonizedCode?: string | null;
    qty?: number | null;
    unit?: string | null;
    unitValueUsd?: number | null;
    totalValueUsd?: number | null;
  }[];
}

export async function generateChallanExcel(data: CommercialInvoiceExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Apparel Sourcing Int'l Inc.";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('COMMERCIAL INVOICE', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  // Set column widths
  worksheet.columns = [
    { width: 42 }, // A: Description of Goods / Shipper
    { width: 22 }, // B: Harmonized Codes / Manufacturer
    { width: 14 }, // C: Quantity (PCS) / Consignee left
    { width: 16 }, // D: UNIT Value (USD)
    { width: 18 }, // E: Total Value (USD)
  ];

  const formattedDate = formatChallanDate(data.date);

  // Row 1: Company Title
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = "Apparel Sourcing Int'l Inc.";
  titleCell.font = { name: 'Arial', size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Row 2: Sub-banner "Commercial Invoice"
  worksheet.mergeCells('A2:E2');
  const subBanner = worksheet.getCell('A2');
  subBanner.value = 'Commercial Invoice';
  subBanner.font = { name: 'Arial', size: 12, bold: true };
  subBanner.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' },
  };
  subBanner.alignment = { horizontal: 'center', vertical: 'middle' };
  subBanner.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };
  worksheet.getRow(2).height = 22;

  // Row 3: AWB NO, INVOICE NO & DATE
  const awbCell = worksheet.getCell('A3');
  awbCell.value = `AWB NO :   ${data.awbNo || ''}`;
  awbCell.font = { name: 'Arial', size: 10, bold: true };
  awbCell.alignment = { horizontal: 'left', vertical: 'middle' };
  awbCell.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };

  worksheet.mergeCells('B3:C3');
  const invCell = worksheet.getCell('B3');
  invCell.value = `INVOICE NO :   ${data.invoiceNo || data.challanNo}`;
  invCell.font = { name: 'Arial', size: 10, bold: true };
  invCell.alignment = { horizontal: 'left', vertical: 'middle' };
  invCell.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };

  worksheet.mergeCells('D3:E3');
  const dateCell = worksheet.getCell('D3');
  dateCell.value = `DATE :   ${formattedDate}`;
  dateCell.font = { name: 'Arial', size: 10, bold: true };
  dateCell.alignment = { horizontal: 'left', vertical: 'middle' };
  dateCell.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };
  worksheet.getRow(3).height = 20;

  // Row 4: Column Headers for 3 Parties
  const hShipper = worksheet.getCell('A4');
  hShipper.value = 'Shipper Name & Address';
  hShipper.font = { name: 'Arial', size: 10, bold: true };
  hShipper.alignment = { horizontal: 'center' };
  hShipper.border = {
    top: { style: 'medium' },
    bottom: { style: 'thin' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };

  const hManuf = worksheet.getCell('B4');
  hManuf.value = 'Manufacturer Name & Address';
  hManuf.font = { name: 'Arial', size: 10, bold: true };
  hManuf.alignment = { horizontal: 'center' };
  hManuf.border = {
    top: { style: 'medium' },
    bottom: { style: 'thin' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };

  worksheet.mergeCells('C4:E4');
  const hConsignee = worksheet.getCell('C4');
  hConsignee.value = 'Consignee Name & Address';
  hConsignee.font = { name: 'Arial', size: 10, bold: true };
  hConsignee.alignment = { horizontal: 'right' };
  hConsignee.border = {
    top: { style: 'medium' },
    bottom: { style: 'thin' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };
  worksheet.getRow(4).height = 20;

  // Row 5: 3 Parties Body Content
  const shipperText = [
    `Company: ${data.shipperCompany}`,
    data.shipperAttn ? `Attn: ${data.shipperAttn}` : '',
    `Address: ${data.shipperAddress}`,
    `City: ${data.shipperCity}`,
    `Postal Code: ${data.shipperPostalCode}`,
    `Country: ${data.shipperCountry}`,
    `Phone: ${data.shipperPhone}`,
    `Email: ${data.shipperEmail}`,
  ].filter(Boolean).join('\n');

  const manufText = [
    `Company: ${data.manufCompany}`,
    `Address: ${data.manufAddress}`,
    `City: ${data.manufCity}`,
    `Postal Code: ${data.manufPostalCode}`,
    `Country: ${data.manufCountry}`,
  ].join('\n');

  const consigneeText = [
    `Company: ${data.name}`,
    data.consigneeAttn ? `Attn: ${data.consigneeAttn}` : '',
    `Address: ${data.address}`,
    `City: ${data.consigneeCity || ''}`,
    `Postal Code: ${data.consigneePostal || ''}`,
    `Country: ${data.consigneeCountry || ''}`,
    `Phone: ${data.consigneePhone || ''}`,
    `Email: ${data.consigneeEmail || ''}`,
    `Tax ID/EIN: ${data.consigneeTaxId || ''}`,
  ].filter(Boolean).join('\n');

  const cellA5 = worksheet.getCell('A5');
  cellA5.value = shipperText;
  cellA5.font = { name: 'Arial', size: 9 };
  cellA5.alignment = { wrapText: true, vertical: 'top' };
  cellA5.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };

  const cellB5 = worksheet.getCell('B5');
  cellB5.value = manufText;
  cellB5.font = { name: 'Arial', size: 9 };
  cellB5.alignment = { wrapText: true, vertical: 'top' };
  cellB5.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };

  worksheet.mergeCells('C5:E5');
  const cellC5 = worksheet.getCell('C5');
  cellC5.value = consigneeText;
  cellC5.font = { name: 'Arial', size: 9 };
  cellC5.alignment = { wrapText: true, vertical: 'top' };
  cellC5.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };
  worksheet.getRow(5).height = 120;

  // Row 6: COUNTRY OF ORIGIN & MID CODE
  worksheet.mergeCells('A6:B6');
  const originCell = worksheet.getCell('A6');
  originCell.value = `COUNTRY OF ORIGIN/MANUFACTURER: ${data.countryOfOrigin}`;
  originCell.font = { name: 'Arial', size: 9.5, bold: true };
  originCell.alignment = { horizontal: 'left', vertical: 'middle' };
  originCell.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };

  worksheet.mergeCells('C6:E6');
  const midCell = worksheet.getCell('C6');
  midCell.value = `MID Code:\n${data.midCode}`;
  midCell.font = { name: 'Arial', size: 9.5, bold: true };
  midCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  midCell.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };
  worksheet.getRow(6).height = 25;

  // Row 7: PURPOSE & TOTAL WEIGHT
  worksheet.mergeCells('A7:B7');
  const purposeCell = worksheet.getCell('A7');
  purposeCell.value = `PURPOSE :  ${data.purpose}`;
  purposeCell.font = { name: 'Arial', size: 9.5, bold: true };
  purposeCell.alignment = { horizontal: 'left', vertical: 'middle' };
  purposeCell.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };

  worksheet.mergeCells('C7:E7');
  const weightCell = worksheet.getCell('C7');
  weightCell.value = `TOTAL WEIGHT :  ${data.totalWeight || ''}`;
  weightCell.font = { name: 'Arial', size: 9.5, bold: true };
  weightCell.alignment = { horizontal: 'left', vertical: 'middle' };
  weightCell.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };
  worksheet.getRow(7).height = 20;

  // Row 8: Goods Table Header
  const headers = [
    'DESCRIPTION OF GOODS',
    'Harmonized Codes',
    'QUANTITY (PCS)',
    'UNIT Value (USD)',
    'Total Value (USD)',
  ];
  const cols = ['A', 'B', 'C', 'D', 'E'];

  cols.forEach((col, idx) => {
    const cell = worksheet.getCell(`${col}8`);
    cell.value = headers[idx];
    cell.font = { name: 'Arial', size: 9.5, bold: true };
    cell.alignment = { horizontal: idx === 0 ? 'center' : 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' },
    };
  });
  worksheet.getRow(8).height = 28;

  // Data rows
  let currentRow = 9;
  data.items.forEach((item) => {
    worksheet.getCell(`A${currentRow}`).value = item.particular;
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.getCell(`B${currentRow}`).value = item.harmonizedCode || '-';
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(`C${currentRow}`).value = item.qty || 0;
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(`D${currentRow}`).value = `$${Number(item.unitValueUsd || 1).toFixed(2)}`;
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(`E${currentRow}`).value = `$ ${Number(item.totalValueUsd || 0).toFixed(2)}`;
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

    cols.forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        left: { style: 'medium' },
        right: { style: 'medium' },
        bottom: { style: 'thin' },
      };
    });
    worksheet.getRow(currentRow).height = 22;
    currentRow++;
  });

  // Blank row
  cols.forEach((col) => {
    const cell = worksheet.getCell(`${col}${currentRow}`);
    cell.value = '';
    cell.border = {
      left: { style: 'medium' },
      right: { style: 'medium' },
      bottom: { style: 'thin' },
    };
  });
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Summary Row
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  const wordsCell = worksheet.getCell(`A${currentRow}`);
  wordsCell.value = `TOTAL VALUE (IN WORD):   ${data.totalValueInWords || `$ ${data.totalAmountUsd.toFixed(2)} Dollar Only.`}`;
  wordsCell.font = { name: 'Arial', size: 9.5, bold: true };
  wordsCell.alignment = { horizontal: 'left', vertical: 'middle' };
  wordsCell.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };

  worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
  const totalLabel = worksheet.getCell(`C${currentRow}`);
  totalLabel.value = 'Total Value (USD)';
  totalLabel.font = { name: 'Arial', size: 9.5, bold: true };
  totalLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  totalLabel.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };

  const totalValCell = worksheet.getCell(`E${currentRow}`);
  totalValCell.value = `$ ${Number(data.totalAmountUsd || 0).toFixed(2)}`;
  totalValCell.font = { name: 'Arial', size: 10, bold: true };
  totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalValCell.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };
  worksheet.getRow(currentRow).height = 24;
  currentRow++;

  // SHOWING VALUE ONLY FOR CUSTOMS PURPOSE (Shaded Banner)
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const customsBanner = worksheet.getCell(`A${currentRow}`);
  customsBanner.value = 'SHOWING VALUE ONLY FOR CUSTOMS PURPOSE';
  customsBanner.font = { name: 'Arial', size: 9.5, bold: true };
  customsBanner.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' },
  };
  customsBanner.alignment = { horizontal: 'center', vertical: 'middle' };
  customsBanner.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // Disclaimer Note
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const noteCell = worksheet.getCell(`A${currentRow}`);
  noteCell.value = data.notes || '** THESE ARE SAMPLE SHIPMENTS, SENT FREE OF COST BASIS. SHOWING VALUE FOR CUSTOMS PURPOSES ONLY.';
  noteCell.font = { name: 'Arial', size: 8.5, bold: true };
  noteCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 22;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
