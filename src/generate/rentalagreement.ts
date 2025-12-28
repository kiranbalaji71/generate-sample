import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, RentalAgreementData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fallback data
const maleLandlords = ["V. Ramani", "S. Rajesh", "R. Kumar"];
const femaleLandlords = ["L. Rekha", "S. Anitha", "G. Divya"];
const maleTenants = ["V. Narendra Babu", "R. Deepak", "M. Dinesh"];
const femaleTenants = ["K. Priya", "L. Meena", "S. Anitha"];
const witnessNames = ["P.V. Naveen", "K. Aruna", "M. Dinesh"];
const addresses = [
  "12 Gandhi St, Anna Nagar, Chennai",
  "22 Mount Road, Chennai",
  "45 MG Road, T Nagar, Chennai",
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateDate(offset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB");
}
function numberToWords(num: number): string {
  const map: Record<number, string> = {
    15000: "Fifteen Thousand",
    20000: "Twenty Thousand",
    25000: "Twenty Five Thousand",
    30000: "Thirty Thousand",
  };
  return map[num] || `${num} Rupees`;
}

// AI generation
async function generateRentalDataAI(n: number): Promise<RentalAgreementData[]> {
  const schema = z.object({
    date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Agreement date in DD/MM/YYYY"),
    landlord_title: z.enum(["Mr.", "Mrs."]),
    landlord_name: z.string().describe("Landlord full name"),
    landlord_address: z.string().describe("Landlord full address"),
    tenant_title: z.enum(["Mr.", "Mrs."]),
    tenant_name: z.string().describe("Tenant full name"),
    tenant_address: z.string().describe("Tenant full address"),
    address: z.string().describe("Property address being rented"),
    rent: z.number().describe("Monthly rent amount"),
    rent_words: z.string().describe("Rent in words"),
    deposit: z.number().describe("Security deposit (typically 3x rent)"),
    witness1_name: z.string().describe("First witness name"),
    witness2_name: z.string().describe("Second witness name"),
  });

  return await generateAIData(
    schema,
    "Indian rental agreement with landlord, tenant, and property details",
    n
  );
}

// Fallback generation
function generateRentalDataFallback(n: number): RentalAgreementData[] {
  const data: RentalAgreementData[] = [];
  for (let i = 0; i < n; i++) {
    const landlordIsMale = Math.random() > 0.4;
    const tenantIsMale = Math.random() > 0.4;
    const rent = randomChoice([15000, 20000, 25000, 30000]);
    data.push({
      date: generateDate(i),
      landlord_title: landlordIsMale ? "Mr." : "Mrs.",
      landlord_name: landlordIsMale
        ? randomChoice(maleLandlords)
        : randomChoice(femaleLandlords),
      landlord_address: randomChoice(addresses),
      tenant_title: tenantIsMale ? "Mr." : "Mrs.",
      tenant_name: tenantIsMale
        ? randomChoice(maleTenants)
        : randomChoice(femaleTenants),
      tenant_address: randomChoice(addresses),
      address: randomChoice(addresses),
      rent,
      rent_words: numberToWords(rent),
      deposit: rent * 3,
      witness1_name: randomChoice(witnessNames),
      witness2_name: randomChoice(witnessNames),
    });
  }
  return data;
}

function generateAgreementPDF(
  row: RentalAgreementData,
  index: number,
  outputDir: string
): void {
  if (!row.tenant_name || !row.landlord_name || !row.address) return;

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const handwrittenFontPath = path.join(
    __dirname,
    "../fonts/Handwritten-1.ttf"
  );
  doc.registerFont("Handwritten", handwrittenFontPath);

  const outputPath = path.join(outputDir, `rental_agreement_${index + 1}.pdf`);
  doc.pipe(fs.createWriteStream(outputPath));

  const stampPath = path.join(
    __dirname,
    "../templates",
    "india-non-judical-template.jpg"
  );
  doc.image(stampPath, 0, 0, { width: doc.page.width });

  const margin = 40;
  const pageWidth = doc.page.width - margin * 2;
  let yPos = 320;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("RENTAL AGREEMENT", margin, yPos, {
      align: "center",
      width: pageWidth,
      underline: true,
    });
  yPos += 40;

  const landlordTitle = row.landlord_title || "";
  const tenantTitle = row.tenant_title || "";

  doc
    .font("Helvetica")
    .fontSize(14)
    .text(
      `This deed of rent made on this day ${row.date || "________"}, between `,
      margin,
      yPos,
      { align: "justify", width: pageWidth, continued: true }
    )
    .font("Helvetica-Bold")
    .text(`${landlordTitle} ${row.landlord_name}`, { continued: true })
    .font("Helvetica")
    .text(
      `, residing at ${row.landlord_address || "________"} (hereinafter called the OWNER, First Party, which expression includes her heirs administrators representatives and assigns of the one part)`
    );

  yPos += 60;
  doc.font("Helvetica").text(`AND`, margin, yPos, { align: "center" });
  yPos += 30;

  doc
    .font("Helvetica")
    .text("", margin, yPos, {
      align: "justify",
      width: pageWidth,
      continued: true,
    })
    .font("Helvetica-Bold")
    .text(`${tenantTitle} ${row.tenant_name}`, { continued: true })
    .font("Helvetica")
    .text(
      `, residing at ${row.tenant_address || "________"} (hereinafter called the TENANT, which term shall wherever the context so admits shall mean and include their successors-in-interest assigns or nominees of the other part).`
    );

  doc.moveDown(15);
  doc
    .font("Handwritten")
    .fontSize(18)
    .text(
      `${row.landlord_name}                                   ${row.tenant_name}`,
      margin,
      doc.y,
      { width: pageWidth }
    );
  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Landlord Signature                                                            Tenant Signature",
      margin,
      doc.y,
      { width: pageWidth }
    );

  doc.addPage({ size: "A4", margin: 40 });
  yPos = doc.y + 20;
  doc
    .font("Helvetica-Bold")
    .text("WITNESSETH AS FOLLOWS:", margin, yPos, {
      underline: true,
      width: pageWidth,
    });
  yPos = doc.y + 10;

  const clauses = [
    `1. The Owner hereby rents the premises at ${row.address} for monthly rent of Rs.${row.rent || "________"} (Rupees ${row.rent_words || "________"} only).`,
    `2. The Tenant shall pay the Owner a sum of Rs.${row.deposit || "________"} towards security deposit. This deposit shall not carry any interest and shall be refunded on vacating the premises after giving due notice and after deduction of arrears/damages, if any.`,
    `3. The Tenant shall pay the monthly rent on or before the 5th day of the succeeding month.`,
    `4. No alterations of any kind shall be carried out by the Tenant without permission.`,
    `5. The Tenant shall make good any losses or damages caused to the building.`,
    `6. The duration of the rent shall be for a period of 11 months.`,
    `7. The Tenant shall directly pay electricity charges and water tax.`,
    `8. Either party may terminate this agreement by giving 3 months' prior notice in writing.`,
    `9. The Tenant shall permit the Owner or agent to inspect the premises with due notice.`,
    `10. On expiry, the Tenant shall deliver possession in the same condition.`,
    `11. The Tenant shall use the premises only as a domestic residence.`,
    `12. The Tenant shall not sublet or use the premises for unlawful purposes.`,
  ];

  doc.font("Helvetica").fontSize(14);
  clauses.forEach((clause) => {
    doc.text(clause, margin, yPos, { align: "justify", width: pageWidth });
    yPos = doc.y + 10;
  });

  doc.addPage({ size: "A4", margin: 40 });
  doc
    .moveDown(2)
    .text(
      `In witness whereof the Owner and Tenant have set their hands today in the presence of witnesses.`,
      margin,
      doc.y,
      { align: "justify", width: pageWidth }
    );

  doc.moveDown(30);
  doc
    .font("Handwritten")
    .fontSize(18)
    .text(
      `${row.landlord_name}                                   ${row.tenant_name}`,
      margin,
      doc.y,
      { width: pageWidth }
    );
  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Landlord Signature                                                            Tenant Signature",
      margin,
      doc.y,
      { width: pageWidth }
    );
  doc.moveDown(1);

  doc
    .font("Handwritten")
    .fontSize(18)
    .text(
      `${row.witness1_name || "________"}                                        ${row.witness2_name || "________"} `,
      margin,
      doc.y,
      { width: pageWidth }
    );
  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Witness 1                                                                          Witness 2",
      margin,
      doc.y,
      { width: pageWidth }
    );

  doc.end();
}

export async function generateRentalAgreements(
  payload: GeneratorPayload,
  res: Response
): Promise<void> {
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample =
      typeof payload.sample === "string"
        ? parseInt(payload.sample)
        : payload.sample || 50;

    let data: RentalAgreementData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating rental agreement data using AI...");
      try {
        data = await generateRentalDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        data = generateRentalDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      data = generateRentalDataFallback(sample as number);
    }

    for (let i = 0; i < sample; i++) {
      generateAgreementPDF(data[i], i, outputDir);
    }

    const zipFile = await zipImages("rental_agreements", outputDir);
    console.log(`🎉 ${sample} rental agreements generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating rental agreements");
  }
}
