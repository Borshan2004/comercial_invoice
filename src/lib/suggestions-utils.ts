import { prisma } from './prisma';

/**
 * Automatically records all non-empty field values from an invoice into the FieldSuggestion database table
 * and saves or updates the ConsigneeProfile so all fields auto-fill when selecting this company in the future.
 */
export async function autoSaveInvoiceSuggestions(invoiceData: {
  name?: string | null;
  address?: string | null;
  consigneeAttn?: string | null;
  consigneeCity?: string | null;
  consigneePostal?: string | null;
  consigneeCountry?: string | null;
  consigneePhone?: string | null;
  consigneeEmail?: string | null;
  consigneeTaxId?: string | null;

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

  countryOfOrigin?: string | null;
  midCode?: string | null;
  purpose?: string | null;
  totalWeight?: string | null;
  awbNo?: string | null;
  notes?: string | null;

  items?: Array<{
    particular?: string | null;
    harmonizedCode?: string | null;
  }>;
}) {
  // 1. Save or update Consignee Profile for auto-filling all company details
  if (invoiceData.name && typeof invoiceData.name === 'string' && invoiceData.name.trim().length > 0) {
    try {
      await prisma.consigneeProfile.upsert({
        where: { name: invoiceData.name.trim() },
        update: {
          address: invoiceData.address?.trim() || '',
          attn: invoiceData.consigneeAttn?.trim() || null,
          city: invoiceData.consigneeCity?.trim() || '',
          postal: invoiceData.consigneePostal?.trim() || '',
          country: invoiceData.consigneeCountry?.trim() || '',
          phone: invoiceData.consigneePhone?.trim() || '',
          email: invoiceData.consigneeEmail?.trim() || '',
          taxId: invoiceData.consigneeTaxId?.trim() || '',
        },
        create: {
          name: invoiceData.name.trim(),
          address: invoiceData.address?.trim() || '',
          attn: invoiceData.consigneeAttn?.trim() || null,
          city: invoiceData.consigneeCity?.trim() || '',
          postal: invoiceData.consigneePostal?.trim() || '',
          country: invoiceData.consigneeCountry?.trim() || '',
          phone: invoiceData.consigneePhone?.trim() || '',
          email: invoiceData.consigneeEmail?.trim() || '',
          taxId: invoiceData.consigneeTaxId?.trim() || '',
        },
      });
    } catch (e) {
      console.error('Failed to upsert consignee profile:', e);
    }
  }

  // 1b. Save or update Shipper Profile for auto-filling all shipper company details
  if (invoiceData.shipperCompany && typeof invoiceData.shipperCompany === 'string' && invoiceData.shipperCompany.trim().length > 0) {
    try {
      await prisma.shipperProfile.upsert({
        where: { company: invoiceData.shipperCompany.trim() },
        update: {
          attn: invoiceData.shipperAttn?.trim() || null,
          address: invoiceData.shipperAddress?.trim() || '',
          city: invoiceData.shipperCity?.trim() || '',
          postalCode: invoiceData.shipperPostalCode?.trim() || '',
          country: invoiceData.shipperCountry?.trim() || '',
          phone: invoiceData.shipperPhone?.trim() || '',
          email: invoiceData.shipperEmail?.trim() || '',
        },
        create: {
          company: invoiceData.shipperCompany.trim(),
          attn: invoiceData.shipperAttn?.trim() || null,
          address: invoiceData.shipperAddress?.trim() || '',
          city: invoiceData.shipperCity?.trim() || '',
          postalCode: invoiceData.shipperPostalCode?.trim() || '',
          country: invoiceData.shipperCountry?.trim() || '',
          phone: invoiceData.shipperPhone?.trim() || '',
          email: invoiceData.shipperEmail?.trim() || '',
        },
      });
    } catch (e) {
      console.error('Failed to upsert shipper profile:', e);
    }
  }

  // 2. Save individual field suggestions
  const fieldsToRecord: Array<{ field: string; value: string }> = [];

  const addIfValid = (field: string, val?: string | null) => {
    if (val && typeof val === 'string' && val.trim().length > 0) {
      fieldsToRecord.push({ field, value: val.trim() });
    }
  };

  addIfValid('name', invoiceData.name);
  addIfValid('address', invoiceData.address);
  addIfValid('consigneeAttn', invoiceData.consigneeAttn);
  addIfValid('consigneeCity', invoiceData.consigneeCity);
  addIfValid('consigneePostal', invoiceData.consigneePostal);
  addIfValid('consigneeCountry', invoiceData.consigneeCountry);
  addIfValid('consigneePhone', invoiceData.consigneePhone);
  addIfValid('consigneeEmail', invoiceData.consigneeEmail);
  addIfValid('consigneeTaxId', invoiceData.consigneeTaxId);

  addIfValid('shipperCompany', invoiceData.shipperCompany);
  addIfValid('shipperAttn', invoiceData.shipperAttn);
  addIfValid('shipperAddress', invoiceData.shipperAddress);
  addIfValid('shipperCity', invoiceData.shipperCity);
  addIfValid('shipperPostalCode', invoiceData.shipperPostalCode);
  addIfValid('shipperCountry', invoiceData.shipperCountry);
  addIfValid('shipperPhone', invoiceData.shipperPhone);
  addIfValid('shipperEmail', invoiceData.shipperEmail);

  addIfValid('manufCompany', invoiceData.manufCompany);
  addIfValid('manufAddress', invoiceData.manufAddress);
  addIfValid('manufCity', invoiceData.manufCity);
  addIfValid('manufPostalCode', invoiceData.manufPostalCode);
  addIfValid('manufCountry', invoiceData.manufCountry);

  addIfValid('countryOfOrigin', invoiceData.countryOfOrigin);
  addIfValid('midCode', invoiceData.midCode);
  addIfValid('purpose', invoiceData.purpose);
  addIfValid('totalWeight', invoiceData.totalWeight);
  addIfValid('awbNo', invoiceData.awbNo);
  addIfValid('notes', invoiceData.notes);

  if (invoiceData.items && Array.isArray(invoiceData.items)) {
    for (const item of invoiceData.items) {
      addIfValid('particular', item.particular);
      addIfValid('harmonizedCode', item.harmonizedCode);
    }
  }

  for (const item of fieldsToRecord) {
    try {
      await prisma.fieldSuggestion.upsert({
        where: {
          field_value: {
            field: item.field,
            value: item.value,
          },
        },
        update: {},
        create: {
          field: item.field,
          value: item.value,
        },
      });
    } catch (e) {
      // Ignore conflict
    }
  }
}
