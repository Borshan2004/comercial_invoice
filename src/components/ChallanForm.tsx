'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Hash,
  Info,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Building2,
  Package,
  FileCheck,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import SuggestionInput, { SuggestionItem } from './SuggestionInput';
import { formatChallanDate, formatValueInWords } from '@/lib/challan-utils';

interface ConsigneeProfile {
  id: string;
  name: string;
  address: string;
  attn?: string | null;
  city?: string | null;
  postal?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
}

interface ShipperProfile {
  id: string;
  company: string;
  attn?: string | null;
  address: string;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface GoodsItemInput {
  slNo: number;
  particular: string;
  harmonizedCode: string;
  qty: number | string;
  unit: string;
  unitValueUsd: number | string;
  totalValueUsd: number | string;
}

interface ChallanFormProps {
  initialData?: {
    id?: string;
    challanNo?: string;
    invoiceNo?: string | null;
    awbNo?: string | null;
    totalWeight?: string | null;
    date?: string | Date;

    shipperCompany?: string | null;
    shipperAttn?: string | null;
    shipperAddress?: string | null;
    shipperCity?: string | null;
    shipperPostalCode?: string | null;
    shipperCountry?: string | null;
    shipperPhone?: string | null;
    shipperEmail?: string | null;

    manufCompany?: string | null;
    manufAddress?: string | null;
    manufCity?: string | null;
    manufPostalCode?: string | null;
    manufCountry?: string | null;

    name?: string;
    address?: string;
    consigneeAttn?: string | null;
    consigneeCity?: string | null;
    consigneePostal?: string | null;
    consigneeCountry?: string | null;
    consigneePhone?: string | null;
    consigneeEmail?: string | null;
    consigneeTaxId?: string | null;

    countryOfOrigin?: string | null;
    midCode?: string | null;
    purpose?: string | null;
    totalValueInWords?: string | null;
    totalAmountUsd?: number | null;
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
  isEdit?: boolean;
  currentUserRole?: string;
}

const DEFAULT_PARTICULARS = [
  "Sample of Men's Shorts- Woven Fabric(97% Cotton,3%Spandex)",
  "Sample of Men's Shorts- Woven (100%Polystar)",
  "Sample of Trims card - J hanger,Coil nylon zipper woven label",
  "Sample of Men's T-Shirt (100% Cotton)",
  "Sample of Men's Polo Shirt (95% Cotton, 5% Spandex)",
  "Sample of Men's Woven Pant",
  "Sample of Men's Jacket",
  "Sample of Hoodie Jacket",
  "Sample of Fabric Swatch Card",
  "Sample of Elastic Band & Twill Tape",
  "Sample of Woven Label & Hang Tag",
  "Sample of Zipper & Button Card",
  "Sample of Size Sticker & Care Label",
];

export default function ChallanForm({
  initialData,
  isEdit = false,
  currentUserRole = 'USER',
}: ChallanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedParties, setShowAdvancedParties] = useState(true);

  // Field suggestions state (grouped by field name)
  const [fieldSuggestions, setFieldSuggestions] = useState<Record<string, SuggestionItem[]>>({});

  // Saved Consignee Profiles for instant auto-fill across all fields
  const [consigneeProfiles, setConsigneeProfiles] = useState<ConsigneeProfile[]>([]);
  const [autoFilledMessage, setAutoFilledMessage] = useState<string | null>(null);

  // Saved Shipper Profiles for instant auto-fill across all shipper fields
  const [shipperProfiles, setShipperProfiles] = useState<ShipperProfile[]>([]);
  const [shipperAutoFilledMessage, setShipperAutoFilledMessage] = useState<string | null>(null);

  // Document identifiers (AWB, Invoice No, Total Weight & Date)
  const [awbNo, setAwbNo] = useState(initialData?.awbNo || '');
  const [invoiceNo, setInvoiceNo] = useState(
    initialData?.invoiceNo || initialData?.challanNo || ''
  );
  const [totalWeight, setTotalWeight] = useState(
    initialData?.totalWeight || '1.50 KG'
  );
  const [challanNo, setChallanNo] = useState(
    initialData?.challanNo || ''
  );

  const [dateDisplay, setDateDisplay] = useState(() => {
    if (initialData?.date) {
      return formatChallanDate(initialData.date);
    }
    return formatChallanDate(new Date());
  });

  // Consignee fields (Primary Recipient)
  const [consigneeCompany, setConsigneeCompany] = useState(
    initialData?.name || 'Bernette Textile Co.Ltd'
  );
  const [consigneeAttn, setConsigneeAttn] = useState(
    initialData?.consigneeAttn ?? 'Nicole / Joey'
  );
  const [consigneeAddress, setConsigneeAddress] = useState(
    initialData?.address || '42 West, 39th Street, 11th Floor,'
  );
  const [consigneeCity, setConsigneeCity] = useState(
    initialData?.consigneeCity || 'New York'
  );
  const [consigneePostal, setConsigneePostal] = useState(
    initialData?.consigneePostal || 'NY 10018'
  );
  const [consigneeCountry, setConsigneeCountry] = useState(
    initialData?.consigneeCountry || 'USA'
  );
  const [consigneePhone, setConsigneePhone] = useState(
    initialData?.consigneePhone || '212-279-5526'
  );
  const [consigneeEmail, setConsigneeEmail] = useState(
    initialData?.consigneeEmail || 'nwezowicz@btexusa.com'
  );
  const [consigneeTaxId, setConsigneeTaxId] = useState(
    initialData?.consigneeTaxId || '320249666'
  );

  // Shipper details (Pre-filled Defaults)
  const [shipperCompany, setShipperCompany] = useState(
    initialData?.shipperCompany || "Apparel Sourcing Int'l Inc"
  );
  const [shipperAttn, setShipperAttn] = useState(
    initialData?.shipperAttn ?? 'Gunjan'
  );
  const [shipperAddress, setShipperAddress] = useState(
    initialData?.shipperAddress || 'House#30, 3rd Floor, Western Road, Banani DOHS'
  );
  const [shipperCity, setShipperCity] = useState(
    initialData?.shipperCity || 'Dhaka'
  );
  const [shipperPostalCode, setShipperPostalCode] = useState(
    initialData?.shipperPostalCode || '1206'
  );
  const [shipperCountry, setShipperCountry] = useState(
    initialData?.shipperCountry || 'Bangladesh'
  );
  const [shipperPhone, setShipperPhone] = useState(
    initialData?.shipperPhone || '880 1774-109199'
  );
  const [shipperEmail, setShipperEmail] = useState(
    initialData?.shipperEmail || 'afaz@apparelsourcingint.com'
  );

  // Manufacturer details (Pre-filled Defaults)
  const [manufCompany, setManufCompany] = useState(
    initialData?.manufCompany || 'PACIFIC BLUE JEANS WEAR LTD (Al muslim group)'
  );
  const [manufAddress, setManufAddress] = useState(
    initialData?.manufAddress || 'A-8/1, JALESHWAR, SAVAR'
  );
  const [manufCity, setManufCity] = useState(
    initialData?.manufCity || 'Dhaka'
  );
  const [manufPostalCode, setManufPostalCode] = useState(
    initialData?.manufPostalCode || '1340'
  );
  const [manufCountry, setManufCountry] = useState(
    initialData?.manufCountry || 'Bangladesh'
  );

  // Origin & Codes
  const [countryOfOrigin, setCountryOfOrigin] = useState(
    initialData?.countryOfOrigin || 'BANGLADESH'
  );
  const [midCode, setMidCode] = useState(
    initialData?.midCode || 'BDASIINC1206DHA'
  );
  const [purpose, setPurpose] = useState(
    initialData?.purpose || 'SAMPLE FOR APPROVAL PURPOSE'
  );
  const [notes, setNotes] = useState(
    initialData?.notes ||
      '** THESE ARE SAMPLE SHIPMENTS, SENT FREE OF COST BASIS. SHOWING VALUE FOR CUSTOMS PURPOSES ONLY.'
  );

  // Goods Items List
  const [items, setItems] = useState<GoodsItemInput[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items.map((it, idx) => ({
        slNo: idx + 1,
        particular: it.particular || '',
        harmonizedCode: it.harmonizedCode || '',
        qty: it.qty ?? '',
        unit: it.unit || 'PCS',
        unitValueUsd: it.unitValueUsd ?? 1.0,
        totalValueUsd:
          it.totalValueUsd ??
          Math.round(((it.qty ?? 0) * (it.unitValueUsd ?? 1.0)) * 100) / 100,
      }));
    }

    return [
      {
        slNo: 1,
        particular: "Sample of Men's Shorts- Woven Fabric(97% Cotton,3%Spandex)",
        harmonizedCode: '9811.00.60',
        qty: 6,
        unit: 'PCS',
        unitValueUsd: 1.0,
        totalValueUsd: 6.0,
      },
      {
        slNo: 2,
        particular: "Sample of Men's Shorts- Woven (100%Polystar)",
        harmonizedCode: '9607.20.90.00',
        qty: 2,
        unit: 'PCS',
        unitValueUsd: 1.0,
        totalValueUsd: 2.0,
      },
      {
        slNo: 3,
        particular: 'Sample of Trims card - J hanger,Coil nylon zipper woven label',
        harmonizedCode: '6203.43.00.00',
        qty: 3,
        unit: 'PCS',
        unitValueUsd: 1.0,
        totalValueUsd: 3.0,
      },
    ];
  });

  // Fetch all saved suggestions, verified invoice no, and consignee profiles from backend on mount
  useEffect(() => {
    // 0. Auto-generate verified Invoice No if creating new invoice
    if (!isEdit && !initialData?.invoiceNo) {
      fetch('/api/challans/next-no')
        .then((res) => res.json())
        .then((data) => {
          if (data.invoiceNo) {
            setInvoiceNo(data.invoiceNo);
            setChallanNo(data.invoiceNo);
          }
        })
        .catch((err) => console.error('Error fetching invoice number:', err));
    }

    // 1. Fetch field suggestions
    fetch('/api/suggestions')
      .then((res) => res.json())
      .then((data) => {
        if (data.suggestions) {
          const suggestionsData = data.suggestions as Record<string, SuggestionItem[]>;
          // Ensure default garments exist in 'particular'
          const existingParticular = suggestionsData['particular'] || [];
          const combinedParticular = [...existingParticular];
          DEFAULT_PARTICULARS.forEach((dp, i) => {
            if (!combinedParticular.some((item) => item.value.toLowerCase() === dp.toLowerCase())) {
              combinedParticular.push({ id: `default-${i}`, value: dp });
            }
          });
          suggestionsData['particular'] = combinedParticular;

          setFieldSuggestions(suggestionsData);
        }
      })
      .catch((err) => console.error('Error fetching suggestions:', err));

    // 2. Fetch full consignee profiles for instant auto-filling across all fields
    fetch('/api/consignees')
      .then((res) => res.json())
      .then((data) => {
        if (data.consignees && Array.isArray(data.consignees)) {
          setConsigneeProfiles(data.consignees);

          // Populate company name suggestions if not present
          const companyNames: string[] = data.consignees.map((c: ConsigneeProfile) => c.name);
          setFieldSuggestions((prev) => {
            const currentNameList = prev['name'] || [];
            const merged = [...currentNameList];
            companyNames.forEach((cn) => {
              if (!merged.some((m) => m.value.toLowerCase() === cn.toLowerCase())) {
                merged.push({ id: `profile-${cn}`, value: cn });
              }
            });
            return { ...prev, name: merged };
          });

          // If brand new invoice with default company name, fill defaults from profile if available
          if (!initialData && consigneeCompany) {
            const match = data.consignees.find(
              (p: ConsigneeProfile) => p.name.trim().toLowerCase() === consigneeCompany.trim().toLowerCase()
            );
            if (match) {
              if (match.address) setConsigneeAddress(match.address);
              if (match.attn) setConsigneeAttn(match.attn);
              if (match.city) setConsigneeCity(match.city);
              if (match.postal) setConsigneePostal(match.postal);
              if (match.country) setConsigneeCountry(match.country);
              if (match.phone) setConsigneePhone(match.phone);
              if (match.email) setConsigneeEmail(match.email);
              if (match.taxId) setConsigneeTaxId(match.taxId);
            }
          }
        }
      })
      .catch((err) => console.error('Error fetching consignees:', err));

    // 3. Fetch full shipper profiles for instant auto-filling across all shipper fields
    fetch('/api/shippers')
      .then((res) => res.json())
      .then((data) => {
        if (data.shippers && Array.isArray(data.shippers)) {
          setShipperProfiles(data.shippers);

          // Populate shipper company suggestions
          const shipperNames: string[] = data.shippers.map((s: ShipperProfile) => s.company);
          setFieldSuggestions((prev) => {
            const currentList = prev['shipperCompany'] || [];
            const merged = [...currentList];
            shipperNames.forEach((cn) => {
              if (!merged.some((m) => m.value.toLowerCase() === cn.toLowerCase())) {
                merged.push({ id: `profile-shipper-${cn}`, value: cn });
              }
            });
            return { ...prev, shipperCompany: merged };
          });

          // If brand new invoice with default company name, fill defaults from profile if available
          if (!initialData && shipperCompany) {
            const match = data.shippers.find(
              (p: ShipperProfile) => p.company.trim().toLowerCase() === shipperCompany.trim().toLowerCase()
            );
            if (match) {
              if (match.address) setShipperAddress(match.address);
              if (match.attn) setShipperAttn(match.attn);
              if (match.city) setShipperCity(match.city);
              if (match.postalCode) setShipperPostalCode(match.postalCode);
              if (match.country) setShipperCountry(match.country);
              if (match.phone) setShipperPhone(match.phone);
              if (match.email) setShipperEmail(match.email);
            }
          }
        }
      })
      .catch((err) => console.error('Error fetching shippers:', err));
  }, []);

  // Auto-fill all consignee fields whenever a company name matches a saved profile
  const applyConsigneeProfile = (companyName: string) => {
    if (!companyName || !companyName.trim()) return;
    const match = consigneeProfiles.find(
      (p) => p.name.trim().toLowerCase() === companyName.trim().toLowerCase()
    );

    if (match) {
      if (match.address) setConsigneeAddress(match.address);
      if (match.attn) setConsigneeAttn(match.attn);
      if (match.city) setConsigneeCity(match.city);
      if (match.postal) setConsigneePostal(match.postal);
      if (match.country) setConsigneeCountry(match.country);
      if (match.phone) setConsigneePhone(match.phone);
      if (match.email) setConsigneeEmail(match.email);
      if (match.taxId) setConsigneeTaxId(match.taxId);

      setAutoFilledMessage(`Auto-filled saved details for "${match.name}"`);
      setTimeout(() => setAutoFilledMessage(null), 4000);
    }
  };

  // Auto-fill all shipper fields whenever a shipper company name matches a saved profile
  const applyShipperProfile = (companyName: string) => {
    if (!companyName || !companyName.trim()) return;
    const match = shipperProfiles.find(
      (p) => p.company.trim().toLowerCase() === companyName.trim().toLowerCase()
    );

    if (match) {
      if (match.address) setShipperAddress(match.address);
      if (match.attn) setShipperAttn(match.attn);
      if (match.city) setShipperCity(match.city);
      if (match.postalCode) setShipperPostalCode(match.postalCode);
      if (match.country) setShipperCountry(match.country);
      if (match.phone) setShipperPhone(match.phone);
      if (match.email) setShipperEmail(match.email);

      setShipperAutoFilledMessage(`Auto-filled saved details for "${match.company}"`);
      setTimeout(() => setShipperAutoFilledMessage(null), 4000);
    }
  };

  const isAdmin = currentUserRole === 'ADMIN';

  // Save new suggestion automatically (callable by everyone)
  const handleSaveSuggestion = async (field: string, value: string) => {
    if (!value || !value.trim()) return;
    const trimmed = value.trim();

    // Immediately update local state so user finds it next time they type
    setFieldSuggestions((prev) => {
      const current = prev[field] || [];
      if (current.some((s) => s.value.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        [field]: [{ id: `client-${Date.now()}`, value: trimmed }, ...current],
      };
    });

    // Save to database in background
    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: trimmed }),
      });
    } catch (e) {
      // background error ignore
    }
  };

  // Delete suggestion (Only visible and usable by Admin)
  const handleDeleteSuggestion = async ({
    id,
    value,
    field,
  }: {
    id?: string;
    value: string;
    field: string;
  }) => {
    if (!isAdmin) return;

    try {
      const res = await fetch('/api/suggestions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete suggestion');
      }

      // Remove from local state immediately
      setFieldSuggestions((prev) => {
        const current = prev[field] || [];
        return {
          ...prev,
          [field]: current.filter((item) =>
            id && !id.startsWith('client-') ? item.id !== id : item.value !== value
          ),
        };
      });
    } catch (err: any) {
      console.error('Delete suggestion error:', err);
      alert(err.message || 'Error deleting suggestion');
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof GoodsItemInput,
    val: any
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'qty' || field === 'unitValueUsd') {
      const q = parseFloat(String(field === 'qty' ? val : item.qty)) || 0;
      const u =
        parseFloat(String(field === 'unitValueUsd' ? val : item.unitValueUsd)) || 0;
      item.totalValueUsd = Math.round(q * u * 100) / 100;
    }

    updated[index] = item;
    setItems(updated);
  };

  const addRow = () => {
    setItems([
      ...items,
      {
        slNo: items.length + 1,
        particular: '',
        harmonizedCode: '',
        qty: 1,
        unit: 'PCS',
        unitValueUsd: 1.0,
        totalValueUsd: 1.0,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          slNo: 1,
          particular: '',
          harmonizedCode: '',
          qty: '',
          unit: 'PCS',
          unitValueUsd: 1.0,
          totalValueUsd: 0.0,
        },
      ]);
      return;
    }
    const updated = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, slNo: idx + 1 }));
    setItems(updated);
  };

  // Live Totals
  const totalQty = items.reduce((sum, item) => {
    const q = parseInt(String(item.qty), 10);
    return sum + (isNaN(q) ? 0 : q);
  }, 0);

  const totalAmountUsd = items.reduce((sum, item) => {
    const t = parseFloat(String(item.totalValueUsd));
    return sum + (isNaN(t) ? 0 : t);
  }, 0);

  const roundedTotalUsd = Math.round(totalAmountUsd * 100) / 100;
  const wordsFormatted = formatValueInWords(roundedTotalUsd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consigneeCompany.trim()) {
      setError('Please enter Consignee Company Name');
      return;
    }

    if (!consigneeAddress.trim()) {
      setError('Please enter Consignee Address');
      return;
    }

    const validItems = items.filter((it) => it.particular.trim() !== '');
    if (validItems.length === 0) {
      setError('Please add at least one Goods item in the table');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        challanNo: invoiceNo.trim() || challanNo.trim(),
        invoiceNo: invoiceNo.trim(),
        awbNo: awbNo.trim(),
        totalWeight: totalWeight.trim(),
        date: new Date(),
        // Shipper
        shipperCompany,
        shipperAttn,
        shipperAddress,
        shipperCity,
        shipperPostalCode,
        shipperCountry,
        shipperPhone,
        shipperEmail,
        // Manufacturer
        manufCompany,
        manufAddress,
        manufCity,
        manufPostalCode,
        manufCountry,
        // Consignee
        name: consigneeCompany,
        address: consigneeAddress,
        consigneeAttn,
        consigneeCity,
        consigneePostal,
        consigneeCountry,
        consigneePhone,
        consigneeEmail,
        consigneeTaxId,
        // Origin & Codes
        countryOfOrigin,
        midCode,
        purpose,
        totalValueInWords: wordsFormatted,
        notes,
        items: validItems,
      };

      const url = isEdit ? `/api/challans/${initialData?.id}` : '/api/challans';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save invoice');
      }

      router.push(`/challans/${data.challan.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-2 gap-3">
        <div>
          <button
            onClick={() => router.push('/challans')}
            type="button"
            className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-1.5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            suppressHydrationWarning
          >
            {isEdit ? `Edit Invoice: ${invoiceNo || challanNo}` : 'Generate New Commercial Invoice'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Apparel Sourcing International Inc • Banani DOHS, Dhaka
          </p>
        </div>

        {/* Server Controlled Badges */}
        <div className="flex items-center space-x-2.5 text-xs">
          <div className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md flex items-center shadow-sm">
            <Hash className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            <span>
              Invoice No:{' '}
              <strong className="text-slate-900 font-semibold" suppressHydrationWarning>
                {invoiceNo || 'Generating...'}
              </strong>
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-md flex items-center shadow-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            <span>
              Date (Dhaka):{' '}
              <strong className="text-emerald-900 font-semibold" suppressHydrationWarning>
                {dateDisplay}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 0: DOCUMENT & SHIPMENT IDENTIFIERS (AWB NO & INVOICE NO) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
              <FileCheck className="w-4 h-4 mr-2 text-blue-600" />
              Document &amp; Shipment Identifiers (Top Header Bar)
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              Matches Commercial Invoice Top Header Layout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. AWB NO */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-[10px] mr-1.5 font-bold">1</span>
                  AWB NO
                </label>
                <span className="text-[10px] text-slate-500 italic">Empty if no input</span>
              </div>
              <SuggestionInput
                field="awbNo"
                value={awbNo}
                onChange={setAwbNo}
                suggestions={fieldSuggestions['awbNo'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="Leave blank or enter AWB (e.g. 8176...)"
                inputClassName="font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If no input is given, it will remain blank on the invoice.
              </p>
            </div>

            {/* 2. INVOICE NO */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-100 text-emerald-700 rounded-full text-[10px] mr-1.5 font-bold">2</span>
                  INVOICE NO
                </label>
                <span className="text-[10px] text-emerald-600 font-semibold">Auto: Asi-XXXXX</span>
              </div>
              <SuggestionInput
                field="invoiceNo"
                value={invoiceNo}
                onChange={(val) => {
                  setInvoiceNo(val);
                  setChallanNo(val);
                }}
                suggestions={fieldSuggestions['invoiceNo'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="e.g. Asi-02564"
                inputClassName="font-mono font-bold text-blue-700 bg-blue-50/50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Automatically generated 5-digit invoice number (e.g. Asi-02564).
              </p>
            </div>

            {/* DATE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  DATE
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Auto Dhaka Date</span>
              </div>
              <div className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-slate-50 text-slate-700 font-semibold flex items-center justify-between">
                <span>{dateDisplay}</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Locked
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Formatted as DD-MMM-YY (e.g. 25-Oct-26).
              </p>
            </div>
          </div>
        </div>
        {/* CARD 1: RECIPIENT & CONSIGNEE INFORMATION */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 flex-wrap gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-blue-600" />
              Consignee &amp; Recipient Information
            </h2>
            {autoFilledMessage && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-300 shadow-sm animate-in fade-in duration-200">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600 flex-shrink-0" />
                {autoFilledMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Consignee / Company Name <span className="text-red-500">*</span>
              </label>
              <SuggestionInput
                field="name"
                value={consigneeCompany}
                onChange={(val) => {
                  setConsigneeCompany(val);
                  applyConsigneeProfile(val);
                }}
                onSelectSuggestion={(val) => {
                  setConsigneeCompany(val);
                  applyConsigneeProfile(val);
                }}
                suggestions={fieldSuggestions['name'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="e.g. Bernette Textile Co.Ltd"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Address <span className="text-red-500">*</span>
              </label>
              <SuggestionInput
                field="address"
                value={consigneeAddress}
                onChange={setConsigneeAddress}
                suggestions={fieldSuggestions['address'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="e.g. 42 West, 39th Street, 11th Floor,"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attn (Contact Person)
              </label>
              <SuggestionInput
                field="consigneeAttn"
                value={consigneeAttn}
                onChange={setConsigneeAttn}
                suggestions={fieldSuggestions['consigneeAttn'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="e.g. Nicole / Joey"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City &amp; Postal Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                <SuggestionInput
                  field="consigneeCity"
                  value={consigneeCity}
                  onChange={setConsigneeCity}
                  suggestions={fieldSuggestions['consigneeCity'] || []}
                  isAdmin={isAdmin}
                  onDeleteSuggestion={handleDeleteSuggestion}
                  onSaveSuggestion={handleSaveSuggestion}
                  placeholder="City"
                />
                <SuggestionInput
                  field="consigneePostal"
                  value={consigneePostal}
                  onChange={setConsigneePostal}
                  suggestions={fieldSuggestions['consigneePostal'] || []}
                  isAdmin={isAdmin}
                  onDeleteSuggestion={handleDeleteSuggestion}
                  onSaveSuggestion={handleSaveSuggestion}
                  placeholder="Postal Code"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country &amp; Phone
              </label>
              <div className="grid grid-cols-2 gap-2">
                <SuggestionInput
                  field="consigneeCountry"
                  value={consigneeCountry}
                  onChange={setConsigneeCountry}
                  suggestions={fieldSuggestions['consigneeCountry'] || []}
                  isAdmin={isAdmin}
                  onDeleteSuggestion={handleDeleteSuggestion}
                  onSaveSuggestion={handleSaveSuggestion}
                  placeholder="Country"
                />
                <SuggestionInput
                  field="consigneePhone"
                  value={consigneePhone}
                  onChange={setConsigneePhone}
                  suggestions={fieldSuggestions['consigneePhone'] || []}
                  isAdmin={isAdmin}
                  onDeleteSuggestion={handleDeleteSuggestion}
                  onSaveSuggestion={handleSaveSuggestion}
                  placeholder="Phone"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email &amp; Tax ID/EIN
              </label>
              <div className="grid grid-cols-2 gap-2">
                <SuggestionInput
                  field="consigneeEmail"
                  value={consigneeEmail}
                  onChange={setConsigneeEmail}
                  suggestions={fieldSuggestions['consigneeEmail'] || []}
                  isAdmin={isAdmin}
                  onDeleteSuggestion={handleDeleteSuggestion}
                  onSaveSuggestion={handleSaveSuggestion}
                  placeholder="Email"
                />
                <SuggestionInput
                  field="consigneeTaxId"
                  value={consigneeTaxId}
                  onChange={setConsigneeTaxId}
                  suggestions={fieldSuggestions['consigneeTaxId'] || []}
                  isAdmin={isAdmin}
                  onDeleteSuggestion={handleDeleteSuggestion}
                  onSaveSuggestion={handleSaveSuggestion}
                  placeholder="Tax ID"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: GOODS DETAILS & HARMONIZED CODES */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                Goods Details &amp; Harmonized Codes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved goods descriptions and HS Codes are remembered. Admins can click &quot;x&quot; to delete suggestions.
              </p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded transition border border-slate-300 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Row
            </button>
          </div>

          <div className="overflow-visible min-h-[200px]">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-700 font-semibold text-xs">
                  <th className="py-2.5 px-2 w-12 text-center">Sl.No</th>
                  <th className="py-2.5 px-3">Description of Goods</th>
                  <th className="py-2.5 px-2 w-40 text-center">Harmonized Code</th>
                  <th className="py-2.5 px-2 w-24 text-center">Qty (PCS)</th>
                  <th className="py-2.5 px-2 w-28 text-center">Unit Val (USD)</th>
                  <th className="py-2.5 px-3 w-32 text-right">Total (USD)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/70 transition relative"
                    style={{ zIndex: items.length - index + 20 }}
                  >
                    <td className="py-2 px-2 text-center text-slate-500 font-medium">
                      {index + 1}
                    </td>

                    <td className="py-2 px-3 relative">
                      <SuggestionInput
                        field="particular"
                        value={item.particular}
                        onChange={(val) => handleItemChange(index, 'particular', val)}
                        suggestions={fieldSuggestions['particular'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                        placeholder={`e.g. Sample of Men's Shorts...`}
                      />
                    </td>

                    <td className="py-2 px-2">
                      <SuggestionInput
                        field="harmonizedCode"
                        value={item.harmonizedCode}
                        onChange={(val) => handleItemChange(index, 'harmonizedCode', val)}
                        suggestions={fieldSuggestions['harmonizedCode'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                        placeholder="e.g. 9811.00.60"
                        inputClassName="text-center font-mono"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold text-slate-800"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <div className="flex items-center">
                        <span className="text-slate-400 text-xs mr-1">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitValueUsd}
                          onChange={(e) =>
                            handleItemChange(index, 'unitValueUsd', e.target.value)
                          }
                          placeholder="1.00"
                          className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ${Number(item.totalValueUsd || 0).toFixed(2)}
                    </td>

                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        title="Remove row"
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live Totals Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center bg-slate-50 p-3 rounded-md">
            <div className="text-xs text-slate-500 flex items-center">
              <Info className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
              <span>Start with 1 row. Add more rows as needed using the &quot;+ Add Row&quot; button above.</span>
            </div>
            <div className="flex items-center space-x-6 text-sm font-semibold">
              <div>
                <span className="text-slate-500 mr-2">Total Qty:</span>
                <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 font-bold">
                  {totalQty} PCS
                </span>
              </div>
              <div>
                <span className="text-slate-500 mr-2">Total Value (USD):</span>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold">
                  ${roundedTotalUsd.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: SHIPPER & MANUFACTURER (Accordion / Expandable with Pre-filled Defaults & Suggestions) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvancedParties(!showAdvancedParties)}
            className="w-full px-5 py-3.5 text-left flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition"
          >
            <div className="flex items-center flex-wrap gap-2">
              <FileCheck className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Shipper, Manufacturer &amp; Customs Defaults
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                (Pre-configured with standard company details)
              </span>
              {shipperAutoFilledMessage && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-300 shadow-sm animate-in fade-in duration-200">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
                  {shipperAutoFilledMessage}
                </span>
              )}
            </div>
            {showAdvancedParties ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showAdvancedParties && (
            <div className="p-5 border-t border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shipper */}
                <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="text-xs font-bold uppercase text-slate-700 block">
                      Shipper Information
                    </span>
                    {shipperAutoFilledMessage && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-300 shadow-sm">
                        <Sparkles className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
                        {shipperAutoFilledMessage}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                      Shipper Company Name <span className="text-blue-600 font-normal">(auto-fills details)</span>
                    </label>
                    <SuggestionInput
                      field="shipperCompany"
                      value={shipperCompany}
                      onChange={(val) => {
                        setShipperCompany(val);
                        applyShipperProfile(val);
                      }}
                      onSelectSuggestion={(val) => {
                        setShipperCompany(val);
                        applyShipperProfile(val);
                      }}
                      suggestions={fieldSuggestions['shipperCompany'] || []}
                      isAdmin={isAdmin}
                      onDeleteSuggestion={handleDeleteSuggestion}
                      onSaveSuggestion={handleSaveSuggestion}
                      placeholder="e.g. Apparel Sourcing Int'l Inc"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Address</label>
                    <SuggestionInput
                      field="shipperAddress"
                      value={shipperAddress}
                      onChange={setShipperAddress}
                      suggestions={fieldSuggestions['shipperAddress'] || []}
                      isAdmin={isAdmin}
                      onDeleteSuggestion={handleDeleteSuggestion}
                      onSaveSuggestion={handleSaveSuggestion}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Attn</label>
                      <SuggestionInput
                        field="shipperAttn"
                        value={shipperAttn}
                        onChange={setShipperAttn}
                        suggestions={fieldSuggestions['shipperAttn'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">City</label>
                      <SuggestionInput
                        field="shipperCity"
                        value={shipperCity}
                        onChange={setShipperCity}
                        suggestions={fieldSuggestions['shipperCity'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Postal</label>
                      <SuggestionInput
                        field="shipperPostalCode"
                        value={shipperPostalCode}
                        onChange={setShipperPostalCode}
                        suggestions={fieldSuggestions['shipperPostalCode'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Country</label>
                      <SuggestionInput
                        field="shipperCountry"
                        value={shipperCountry}
                        onChange={setShipperCountry}
                        suggestions={fieldSuggestions['shipperCountry'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Phone</label>
                      <SuggestionInput
                        field="shipperPhone"
                        value={shipperPhone}
                        onChange={setShipperPhone}
                        suggestions={fieldSuggestions['shipperPhone'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Email</label>
                      <SuggestionInput
                        field="shipperEmail"
                        value={shipperEmail}
                        onChange={setShipperEmail}
                        suggestions={fieldSuggestions['shipperEmail'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                  </div>
                </div>

                {/* Manufacturer */}
                <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold uppercase text-slate-700 block border-b pb-1">
                    Manufacturer Information
                  </span>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Company</label>
                    <SuggestionInput
                      field="manufCompany"
                      value={manufCompany}
                      onChange={setManufCompany}
                      suggestions={fieldSuggestions['manufCompany'] || []}
                      isAdmin={isAdmin}
                      onDeleteSuggestion={handleDeleteSuggestion}
                      onSaveSuggestion={handleSaveSuggestion}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Address</label>
                    <SuggestionInput
                      field="manufAddress"
                      value={manufAddress}
                      onChange={setManufAddress}
                      suggestions={fieldSuggestions['manufAddress'] || []}
                      isAdmin={isAdmin}
                      onDeleteSuggestion={handleDeleteSuggestion}
                      onSaveSuggestion={handleSaveSuggestion}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">City</label>
                      <SuggestionInput
                        field="manufCity"
                        value={manufCity}
                        onChange={setManufCity}
                        suggestions={fieldSuggestions['manufCity'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Postal</label>
                      <SuggestionInput
                        field="manufPostalCode"
                        value={manufPostalCode}
                        onChange={setManufPostalCode}
                        suggestions={fieldSuggestions['manufPostalCode'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Country</label>
                      <SuggestionInput
                        field="manufCountry"
                        value={manufCountry}
                        onChange={setManufCountry}
                        suggestions={fieldSuggestions['manufCountry'] || []}
                        isAdmin={isAdmin}
                        onDeleteSuggestion={handleDeleteSuggestion}
                        onSaveSuggestion={handleSaveSuggestion}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CARD 4: CUSTOMS METADATA & FOOTER NOTE */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 pb-2 border-b border-slate-100">
            Customs Metadata &amp; Document Policy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country of Origin / Manufacturer
              </label>
              <SuggestionInput
                field="countryOfOrigin"
                value={countryOfOrigin}
                onChange={setCountryOfOrigin}
                suggestions={fieldSuggestions['countryOfOrigin'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="BANGLADESH"
                inputClassName="font-semibold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MID Code
              </label>
              <SuggestionInput
                field="midCode"
                value={midCode}
                onChange={setMidCode}
                suggestions={fieldSuggestions['midCode'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="BDASIINC1206DHA"
                inputClassName="font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purpose
              </label>
              <SuggestionInput
                field="purpose"
                value={purpose}
                onChange={setPurpose}
                suggestions={fieldSuggestions['purpose'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="SAMPLE FOR APPROVAL PURPOSE"
                inputClassName="font-semibold uppercase"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-700 rounded-full text-[10px] mr-1.5 font-bold">3</span>
                  Total Weight
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Under MID Code</span>
              </div>
              <SuggestionInput
                field="totalWeight"
                value={totalWeight}
                onChange={setTotalWeight}
                suggestions={fieldSuggestions['totalWeight'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="e.g. 1.50 KG"
                inputClassName="font-semibold"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customs Footer Note
              </label>
              <SuggestionInput
                field="notes"
                value={notes}
                onChange={setNotes}
                suggestions={fieldSuggestions['notes'] || []}
                isAdmin={isAdmin}
                onDeleteSuggestion={handleDeleteSuggestion}
                onSaveSuggestion={handleSaveSuggestion}
                placeholder="** THESE ARE SAMPLE SHIPMENTS, SENT FREE OF COST BASIS. SHOWING VALUE FOR CUSTOMS PURPOSES ONLY."
              />
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/challans')}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {loading
              ? 'Saving...'
              : isEdit
              ? 'Update Invoice'
              : 'Save & Submit Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
