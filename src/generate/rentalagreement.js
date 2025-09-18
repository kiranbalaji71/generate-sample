// generate_rental_agreements.js
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure output dir exists
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// --------------------
// Sample Data Pools
// --------------------
const maleLandlords = [
  "V. Ramani",
  "S. Rajesh",
  "R. Kumar",
  "K. Shankar",
  "P. Srinivas",
];
const femaleLandlords = ["L. Rekha", "S. Anitha", "G. Divya", "M. Kavitha"];
const maleTenants = ["V. Narendra Babu", "R. Deepak", "M. Dinesh", "K. Arjun"];
const femaleTenants = ["K. Priya", "L. Meena", "S. Anitha", "R. Kavitha"];
const witnessNames = [
  "P.V. Naveen",
  "K. Aruna",
  "M. Dinesh",
  "J. Kavitha",
  "T. Surya",
];
const addresses = [
  "12 Gandhi St, Anna Nagar, Chennai",
  "22 Mount Road, Chennai",
  "45 MG Road, T Nagar, Chennai",
  "67 North Street, Madurai",
  "Flat 22, Mount Road, Chennai",
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB");
}
function numberToWords(num) {
  const map = {
    15000: "Fifteen Thousand",
    20000: "Twenty Thousand",
    25000: "Twenty Five Thousand",
    30000: "Thirty Thousand",
  };
  return map[num] || `${num} Rupees`;
}

// --------------------
// Generate Single Agreement PDF
// --------------------
function generateAgreementPDF(row, index, outputDir) {
  if (!row.tenant_name || !row.landlord_name || !row.address) return;

  // No margin initially → we’ll manually control text margins
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const handwrittenFontPath = path.join(
    __dirname,
    "../fonts/Handwritten-1.ttf"
  );
  doc.registerFont("Handwritten", handwrittenFontPath);

  const outputPath = path.join(outputDir, `rental_agreement_${index + 1}.pdf`);
  doc.pipe(fs.createWriteStream(outputPath));

  // Add stamp paper image at top (spanning full width)
  const stampPath = path.join(
    __dirname,
    "../templates",
    "india-non-judical-template.jpg"
  );
  doc.image(stampPath, 0, 0, { width: doc.page.width });

  // Define text margin box (40px all around)
  const margin = 40;
  const pageWidth = doc.page.width - margin * 2;
  let yPos = 320; // start text below image (image height ~300px + padding 20px)

  // Title
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("RENTAL AGREEMENT", margin, yPos, {
      align: "center",
      width: pageWidth,
      underline: true,
    });

  yPos += 40;

  // Agreement body text
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

  yPos += 60; // adjust spacing as needed

  doc.font("Helvetica").text(`AND`, margin, yPos, { align: "center" });

  yPos += 30; // adjust spacing

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
      {
        width: pageWidth,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Landlord Signature                                                            Tenant Signature",
      margin,
      doc.y,
      {
        width: pageWidth,
      }
    );

  doc.addPage({ size: "A4", margin: 40 });
  yPos = doc.y + 20;

  doc.font("Helvetica-Bold").text("WITNESSETH AS FOLLOWS:", margin, yPos, {
    underline: true,
    width: pageWidth,
  });

  yPos = doc.y + 10;

  // Clauses (each adds spacing)
  const clauses = [
    `1. The Owner hereby rents the premises at ${row.address} for monthly rent of 
Rs.${row.rent || "________"} (Rupees ${row.rent_words || "________"} only).`,
    `2. The Tenant shall pay the Owner a sum of Rs.${row.deposit || "________"} 
towards security deposit. This deposit shall not carry any interest and shall be refunded 
on vacating the premises after giving due notice and after deduction of arrears/damages, if any.`,
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
  // Closing note
  doc.moveDown(2).text(
    `In witness whereof the Owner and Tenant have set their hands today in the 
presence of witnesses.`,
    margin,
    doc.y,
    { align: "justify", width: pageWidth }
  );

  // Signatures
  doc.moveDown(30);
  doc
    .font("Handwritten")
    .fontSize(18)
    .text(
      `${row.landlord_name}                                   ${row.tenant_name}`,
      margin,
      doc.y,
      {
        width: pageWidth,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Landlord Signature                                                            Tenant Signature",
      margin,
      doc.y,
      {
        width: pageWidth,
      }
    );
  doc.moveDown(1);

  // Witnesses
  doc
    .font("Handwritten")
    .fontSize(18)
    .text(
      `${row.witness1_name || "________"}                                        ${row.witness2_name || "________"} `,
      margin,
      doc.y,
      {
        width: pageWidth,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Witness 1                                                                          Witness 2",
      margin,
      doc.y,
      {
        width: pageWidth,
      }
    );

  doc.end();
}

// --------------------
// Exported Function
// --------------------
export async function generateRentalAgreements(payload, res) {
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 10;

    // Generate data and PDFs
    for (let i = 0; i < sample; i++) {
      const date = generateDate(i);
      const landlordIsMale = Math.random() > 0.4;
      const tenantIsMale = Math.random() > 0.4;
      const rent = randomChoice([15000, 20000, 25000, 30000]);

      const data = {
        date,
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
      };

      generateAgreementPDF(data, i, outputDir);
    }

    // Zip PDFs
    const zipFile = await zipImages("rental_agreements", outputDir);
    console.log(`🎉 ${sample} rental agreements generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating rental agreements");
  }
}
