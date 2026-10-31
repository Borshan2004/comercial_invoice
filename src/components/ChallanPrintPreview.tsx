'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Edit,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { formatChallanDate } from '@/lib/challan-utils';

interface ChallanPrintPreviewProps {
  challan: {
    id: string;
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

    name: string;
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
  };
  currentUserRole?: string;
}

export default function ChallanPrintPreview({
  challan,
  currentUserRole = 'USER',
}: ChallanPrintPreviewProps) {
  const router = useRouter();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formattedDate = formatChallanDate(challan.date);
  const isAdmin = currentUserRole === 'ADMIN';

  // Handle native browser print
  const handlePrint = () => {
    window.print();
  };

  // Direct PDF download
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setDownloadingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5, // Crisp resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 287));
      pdf.save(`Commercial-Invoice-${(challan.invoiceNo || challan.challanNo).replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not export PDF directly. Please use "Print (A4)" and choose "Save as PDF".');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Direct Excel download
  const handleDownloadExcel = () => {
    window.open(`/api/challans/${challan.id}/excel`, '_blank');
  };

  // Delete invoice
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete Invoice ${challan.challanNo}?`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/challans/${challan.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete invoice');
      }
      router.push('/challans');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting invoice');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 sm:px-6">
      {/* Action Toolbar (Hidden in Print) */}
      <div className="no-print mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/challans')}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Registry
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-bold text-slate-800">
            Invoice: {challan.invoiceNo || challan.challanNo}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print A4 */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-700" />
            Print (1 Page A4)
          </button>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {downloadingPdf ? 'Exporting PDF...' : 'Download PDF'}
          </button>

          {/* Download Excel button */}
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Download Excel
          </button>

          {/* Edit - ONLY VISIBLE TO ADMIN */}
          {isAdmin && (
            <>
              <span className="text-slate-300">|</span>
              <Link
                href={`/challans/${challan.id}/edit`}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 transition"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                Edit
              </Link>
            </>
          )}

          {/* Delete - Admin only */}
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-300 transition"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* The Printable Page Container: Exactly matches picture 1 */}
      <div
        ref={printAreaRef}
        className="print-page bg-white p-6 sm:p-8 rounded-none border border-slate-300 shadow-md text-black max-w-[210mm] mx-auto"
      >
        {/* 1. Header with Logo & Title */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center space-x-4 w-20">
            <img
              src="/asi-logo.png"
              alt="ASI Logo"
              className="w-16 h-12 object-contain"
            />
          </div>
          <div className="text-center flex-1 pr-16">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
              Apparel Sourcing Int&apos;l Inc.
            </h1>
          </div>
        </div>

        {/* 2. Unified Solid Bordered Sheet (Zero Gaps Between Rows) */}
        <div className="border-2 border-black bg-white">
          {/* Sub-Banner: Commercial Invoice */}
          <div className="bg-[#e9ecef] border-b-2 border-black py-1.5 text-center">
            <span className="text-sm font-bold tracking-wide text-black uppercase">
              Commercial Invoice
            </span>
          </div>

          {/* Row 1: AWB NO, INVOICE NO & DATE */}
          <div className="border-b-2 border-black grid grid-cols-12 text-xs bg-white">
            <div className="col-span-4 flex items-center border-r-2 border-black p-1 px-2.5">
              <span className="font-extrabold text-black uppercase tracking-wider mr-2">
                AWB NO :
              </span>
              <span className="font-bold text-black text-xs sm:text-sm">
                {challan.awbNo || ''}
              </span>
            </div>
            <div className="col-span-4 flex items-center border-r-2 border-black p-1 px-2.5">
              <span className="font-extrabold text-black uppercase tracking-wider mr-2">
                INVOICE NO :
              </span>
              <span className="font-bold text-black text-xs sm:text-sm">
                {challan.invoiceNo || challan.challanNo}
              </span>
            </div>
            <div className="col-span-4 flex items-center p-1 px-2.5">
              <span className="font-extrabold text-black uppercase tracking-wider mr-2">
                DATE :
              </span>
              <span className="font-bold text-black text-xs sm:text-sm">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Row 2: Three Party Columns (Shipper, Manufacturer, Consignee) */}
          <div className="border-b-2 border-black grid grid-cols-3 text-[10.5px] leading-relaxed">
            {/* Column 1: Shipper */}
            <div className="border-r-2 border-black p-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-center border-b border-black pb-1 mb-1.5 text-[11px] uppercase tracking-tight text-black">
                  Shipper Name &amp; Address
                </div>
                <div className="space-y-0.5 text-black">
                  <div>
                    <span className="font-bold">Company: </span>
                    <span>{challan.shipperCompany}</span>
                  </div>
                  {challan.shipperAttn && (
                    <div>
                      <span className="font-bold">Attn: </span>
                      <span>{challan.shipperAttn}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold">Address: </span>
                    <span>{challan.shipperAddress}</span>
                  </div>
                  <div>
                    <span className="font-bold">City: </span>
                    <span>{challan.shipperCity}</span>
                  </div>
                  <div>
                    <span className="font-bold">Postal Code: </span>
                    <span>{challan.shipperPostalCode}</span>
                  </div>
                  <div>
                    <span className="font-bold">Country: </span>
                    <span>{challan.shipperCountry}</span>
                  </div>
                  <div>
                    <span className="font-bold">Phone: </span>
                    <span>{challan.shipperPhone}</span>
                  </div>
                  <div>
                    <span className="font-bold">Email: </span>
                    <span>{challan.shipperEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Manufacturer */}
            <div className="border-r-2 border-black p-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-center border-b border-black pb-1 mb-1.5 text-[11px] uppercase tracking-tight text-black">
                  Manufacturer Name &amp; Address
                </div>
                <div className="space-y-0.5 text-black">
                  <div>
                    <span className="font-bold">Company: </span>
                    <span>{challan.manufCompany}</span>
                  </div>
                  <div>
                    <span className="font-bold">Address: </span>
                    <span>{challan.manufAddress}</span>
                  </div>
                  <div>
                    <span className="font-bold">City: </span>
                    <span>{challan.manufCity}</span>
                  </div>
                  <div>
                    <span className="font-bold">Postal Code: </span>
                    <span>{challan.manufPostalCode}</span>
                  </div>
                  <div>
                    <span className="font-bold">Country: </span>
                    <span>{challan.manufCountry}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Consignee */}
            <div className="p-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-right border-b border-black pb-1 mb-1.5 text-[11px] uppercase tracking-tight text-black">
                  Consignee Name &amp; Address
                </div>
                <div className="space-y-0.5 text-black">
                  <div>
                    <span className="font-bold">Company: </span>
                    <span>{challan.name}</span>
                  </div>
                  {challan.consigneeAttn && (
                    <div>
                      <span className="font-bold">Attn: </span>
                      <span>{challan.consigneeAttn}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold">Address: </span>
                    <span>{challan.address}</span>
                  </div>
                  <div>
                    <span className="font-bold">City: </span>
                    <span>{challan.consigneeCity}</span>
                  </div>
                  <div>
                    <span className="font-bold">Postal Code: </span>
                    <span>{challan.consigneePostal}</span>
                  </div>
                  <div>
                    <span className="font-bold">Country: </span>
                    <span>{challan.consigneeCountry}</span>
                  </div>
                  <div>
                    <span className="font-bold">Phone: </span>
                    <span>{challan.consigneePhone}</span>
                  </div>
                  <div>
                    <span className="font-bold">Email: </span>
                    <a
                      href={`mailto:${challan.consigneeEmail}`}
                      className="text-blue-700 underline"
                    >
                      {challan.consigneeEmail}
                    </a>
                  </div>
                  <div>
                    <span className="font-bold">Tax ID/EIN: </span>
                    <span>{challan.consigneeTaxId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Origin / Manufacturer & MID Code Row */}
          <div className="border-b-2 border-black grid grid-cols-3 text-xs bg-white">
            <div className="col-span-2 border-r-2 border-black p-1.5 px-2.5 flex items-center">
              <span className="font-extrabold text-black uppercase tracking-tight mr-2">
                COUNTRY OF ORIGIN/MANUFACTURER:
              </span>
              <span className="font-bold text-black uppercase">
                {challan.countryOfOrigin}
              </span>
            </div>
            <div className="p-1 flex flex-col justify-center text-center">
              <div className="font-bold text-xs text-black">MID Code:</div>
              <div className="font-bold text-xs text-black tracking-wider">
                {challan.midCode}
              </div>
            </div>
          </div>

          {/* Row 4: PURPOSE & TOTAL WEIGHT Row */}
          <div className="border-b-2 border-black grid grid-cols-3 text-xs bg-white">
            <div className="col-span-2 border-r-2 border-black p-1.5 px-2.5 flex items-center">
              <span className="font-bold text-black uppercase tracking-wider mr-2">
                PURPOSE :
              </span>
              <span className="font-semibold text-black uppercase">
                {challan.purpose}
              </span>
            </div>
            <div className="p-1.5 px-2.5 flex items-center">
              <span className="font-bold text-black uppercase tracking-wider mr-2">
                TOTAL WEIGHT :
              </span>
              <span className="font-semibold text-black uppercase">
                {challan.totalWeight || ''}
              </span>
            </div>
          </div>

          {/* Row 5: Goods Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-black font-extrabold uppercase text-center text-[10.5px]">
                <th className="py-2 px-3 border-r-2 border-black text-center w-[48%]">
                  DESCRIPTION OF GOODS
                </th>
                <th className="py-2 px-2 border-r-2 border-black text-center w-[20%]">
                  Harmonized Codes
                </th>
                <th className="py-2 px-1 border-r-2 border-black text-center w-[10%]">
                  QUANTITY
                  <br />
                  (PCS)
                </th>
                <th className="py-2 px-1 border-r-2 border-black text-center w-[10%]">
                  UNIT
                  <br />
                  Value
                  <br />
                  (USD)
                </th>
                <th className="py-2 px-2 text-center w-[12%]">
                  Total Value (USD)
                </th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-black text-xs text-black"
                >
                  <td className="py-1.5 px-3 border-r-2 border-black font-normal">
                    {item.particular}
                  </td>
                  <td className="py-1.5 px-2 border-r-2 border-black text-center font-normal">
                    {item.harmonizedCode || '-'}
                  </td>
                  <td className="py-1.5 px-1 border-r-2 border-black text-center font-medium">
                    {item.qty}
                  </td>
                  <td className="py-1.5 px-1 border-r-2 border-black text-center font-normal">
                    ${Number(item.unitValueUsd || 1).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium">
                    <div className="flex justify-between">
                      <span>$</span>
                      <span>{Number(item.totalValueUsd || 0).toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Blank Row from sample template */}
              <tr className="border-b-2 border-black h-7 bg-white">
                <td className="border-r-2 border-black"></td>
                <td className="border-r-2 border-black"></td>
                <td className="border-r-2 border-black"></td>
                <td className="border-r-2 border-black"></td>
                <td></td>
              </tr>

              {/* Summary / Total Row */}
              <tr className="border-b-2 border-black font-bold text-xs bg-white">
                <td
                  colSpan={2}
                  className="py-2 px-3 border-r-2 border-black text-left"
                >
                  <div className="flex items-center">
                    <span className="font-extrabold text-black uppercase tracking-wider mr-2">
                      TOTAL VALUE (IN WORD):
                    </span>
                    <span className="font-bold text-black">
                      {challan.totalValueInWords || `$ ${challan.totalAmountUsd.toFixed(2)} Dollar Only.`}
                    </span>
                  </div>
                </td>
                <td
                  colSpan={2}
                  className="py-2 px-2 border-r-2 border-black text-center font-extrabold text-black"
                >
                  Total Value (USD)
                </td>
                <td className="py-2 px-3 text-right font-extrabold text-black">
                  <div className="flex justify-between">
                    <span>$</span>
                    <span>{Number(challan.totalAmountUsd || 0).toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 6: SHOWING VALUE ONLY FOR CUSTOMS PURPOSE (Grey banner) */}
          <div className="bg-[#e9ecef] py-1.5 text-center">
            <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-black">
              SHOWING VALUE ONLY FOR CUSTOMS PURPOSE
            </span>
          </div>
        </div>

        {/* 3. Bottom Disclaimer Note */}
        <div className="mt-3 text-[10.5px] font-bold text-black leading-snug">
          {challan.notes ||
            '** THESE ARE SAMPLE SHIPMENTS, SENT FREE OF COST BASIS. SHOWING VALUE FOR CUSTOMS PURPOSES ONLY.'}
        </div>

        {/* 4. Authorised Signatory Block (Matches Picture 1 with ample signing space on top) */}
        <div className="mt-14 sm:mt-16 text-xs text-black leading-relaxed space-y-0.5">
          <div className="font-extrabold text-black">Authorised Signatory</div>
          <div className="font-bold text-black">For Apparel Sourcing Int&apos;l Inc</div>
          <div className="font-medium text-slate-800">Name: Mr.Srabon Purification</div>
          <div className="font-medium text-slate-800">Phn: +8801774-109199</div>
          <div className="font-medium text-slate-800">E-mail: courier@apparelsourcingint.com</div>
        </div>
      </div>
    </div>
  );
}
