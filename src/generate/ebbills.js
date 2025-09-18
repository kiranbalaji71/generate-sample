// generate_eb_bills.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory for EB images
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
} else {
  // clear old images before generating
  fs.readdirSync(outputDir).forEach((file) =>
    fs.unlinkSync(path.join(outputDir, file))
  );
}

// Tamil Nadu names
const firstNames = [
  "Arun",
  "Karthik",
  "Prakash",
  "Suresh",
  "Vijay",
  "Ramesh",
  "Balaji",
  "Sathish",
  "Murugan",
  "Saravanan",
  "Muthu",
  "Anitha",
  "Kavitha",
  "Revathi",
  "Divya",
  "Lakshmi",
  "Priya",
  "Meena",
  "Janani",
  "Uma",
];
const lastNames = [
  "Subramanian",
  "Ramasamy",
  "Krishnan",
  "Ganesan",
  "Srinivasan",
  "Chidambaram",
  "Perumal",
  "Rajendran",
  "Velu",
  "Kannan",
  "Sekar",
  "Arumugam",
  "Mani",
  "Venkatesan",
];

const cardTypes = [
  "AXIS NET BANKING",
  "SBI NET BANKING",
  "HDFC CREDIT CARD",
  "ICICI DEBIT CARD",
];
const bankAuthIds = ["TNEB0127", "TNEB0459", "TNEB0998", "TNEB1234"];
const receiptPrefixes = ["PGNAXI", "TXNID", "PAYGOV", "EBILL"];

// Helpers
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateRandomName() {
  return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`.toUpperCase();
}
function generateServiceNo(index) {
  return String(4100000000 + index);
}
function generateBillAmount() {
  return Math.floor(100 + Math.random() * 900);
}
function generateBillMonthYear() {
  const now = new Date();
  const randomOffset = Math.floor(Math.random() * 3);
  const date = new Date(now.getFullYear(), now.getMonth() - randomOffset, 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${month}/${date.getFullYear()}`;
}
function generateReceiptNo() {
  return `${randomChoice(receiptPrefixes)}${Math.floor(100000 + Math.random() * 900000)}`;
}
function generateReceiptDate() {
  const now = new Date();
  const randomOffset = Math.floor(Math.random() * 90);
  const date = new Date(now.getTime() - randomOffset * 24 * 60 * 60 * 1000);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const formatted = date.toLocaleDateString("en-GB"); // dd/mm/yyyy
  return `${weekday} ${formatted}`;
}
function generateTransactionNo() {
  return Math.floor(100000000 + Math.random() * 900000000); // 9-digit
}

function generateEbBillData(n = 100) {
  return Array.from({ length: n }, (_, i) => {
    const billAmount = generateBillAmount();
    return {
      service_no: generateServiceNo(i),
      name: generateRandomName(),
      bill_amount: billAmount.toFixed(2),
      bill_month_year: generateBillMonthYear(),
      receipt_no: generateReceiptNo(),
      receipt_date: generateReceiptDate(),
      amount_debited: billAmount.toFixed(2),
      bank_transaction_no: generateTransactionNo(),
      bank_authorisation_id: randomChoice(bankAuthIds),
      card_type: randomChoice(cardTypes),
    };
  });
}

// Generate single EB bill
async function generateSingleBill(data, index) {
  const baseImage = await loadImage(
    path.join(__dirname, "../templates", "EB-bill-sample-template.png")
  );

  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);

  ctx.font = "bold 10px Arial, sans-serif";
  ctx.fillStyle = "black";

  ctx.fillText(data.service_no, 114, 86);
  ctx.fillText(data.name, 286, 86);
  ctx.fillText(data.bill_amount, 113, 105);
  ctx.fillText(data.bill_month_year, 322, 105);
  ctx.fillText(data.receipt_no, 112, 130);
  ctx.fillText(data.receipt_date, 315, 130);
  ctx.fillText(data.amount_debited, 126, 160);
  ctx.fillText(data.bank_transaction_no, 327, 167);
  ctx.fillText(data.bank_authorisation_id, 129, 196);
  ctx.fillText(data.card_type, 303, 191);

  const outputPath = path.join(outputDir, `eb_bill_${index + 1}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
}

// Main API function
export async function generateEBBills(payload, res) {
  // Clear old images
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 50;
    const bills = generateEbBillData(sample);

    for (let i = 0; i < bills.length; i++) {
      await generateSingleBill(bills[i], i);
    }
    // Create zip
    const zipFile = await zipImages("eb_bills", outputDir);
    console.log(`🎉 ${sample} EB bills generated -> ${zipFile}`);

    // Return file
    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate EB bills" });
  }
}
