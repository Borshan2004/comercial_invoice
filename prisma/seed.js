const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const suggestions = [
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

async function main() {
  console.log('Seeding database...');

  // Seed Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'System Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user ready:', admin.username);

  // Seed Normal user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      name: 'Standard Staff',
      passwordHash: userPassword,
      role: 'USER',
    },
  });
  console.log('Standard user ready:', user.username);

  // Seed Particular Suggestions
  for (let i = 0; i < suggestions.length; i++) {
    const item = suggestions[i];
    await prisma.particularSuggestion.upsert({
      where: { name: item },
      update: { order: i + 1 },
      create: {
        name: item,
        order: i + 1,
      },
    });
  }
  console.log(`Seeded ${suggestions.length} particular suggestions.`);

  // Seed the exact sample Commercial Invoice from picture
  await prisma.challan.upsert({
    where: { challanNo: '8176 2297 3936' },
    update: {},
    create: {
      challanNo: '8176 2297 3936',
      date: new Date('2026-10-20'),
      shipperCompany: "Apparel Sourcing Int'l Inc",
      shipperAttn: 'Gunjan',
      shipperAddress: 'House#30, 3rd Floor, Western Road, Banani DOHS',
      shipperCity: 'Dhaka',
      shipperPostalCode: '1206',
      shipperCountry: 'Bangladesh',
      shipperPhone: '880 1774-109199',
      shipperEmail: 'afaz@apparelsourcingint.com',

      manufCompany: 'PACIFIC BLUE JEANS WEAR LTD (Al muslim group)',
      manufAddress: 'A-8/1, JALESHWAR, SAVAR',
      manufCity: 'Dhaka',
      manufPostalCode: '1340',
      manufCountry: 'Bangladesh',

      name: 'Bernette Textile Co.Ltd',
      address: '42 West, 39th Street, 11th Floor,',
      consigneeAttn: 'Nicole / Joey',
      consigneeCity: 'New York',
      consigneePostal: 'NY 10018',
      consigneeCountry: 'USA',
      consigneePhone: '212-279-5526',
      consigneeEmail: 'nwezowicz@btexusa.com',
      consigneeTaxId: '320249666',

      countryOfOrigin: 'BANGLADESH',
      midCode: 'BDASIINC1206DHA',
      purpose: 'SAMPLE FOR APPROVAL PURPOSE',
      totalValueInWords: '$ 11.00  Dollar Only.',
      totalAmountUsd: 11.0,
      totalQty: 11,
      notes: '** THESE ARE SAMPLE SHIPMENTS, SENT FREE OF COST BASIS. SHOWING VALUE FOR CUSTOMS PURPOSES ONLY.',
      createdById: admin.id,
      items: {
        create: [
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
        ],
      },
    },
  });
  console.log('Seeded sample commercial invoice 8176 2297 3936');

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
