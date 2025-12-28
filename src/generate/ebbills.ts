import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, EBBillData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fallback data
const firstNames = ["Arun", "Karthik", "Prakash", "Anitha", "Kavitha"];
const lastNames = ["Subramanian", "Ramasamy", "Krishnan", "Ganesan"];
const cardTypes = ["AXIS NET BANKING", "SBI NET BANKING", "HDFC CREDIT CARD"];
const bankAuthIds = ["TNEB0127", "TNEB0459", "TNEB0998"];
const receiptPrefixes = ["PGNAXI", "TXNID", "PAYGOV"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// AI generation
async function generateEbBillDataAI(n: number): Promise<EBBillData[]> {
  const schema = z.object({
    service_no: z.string().describe("Service number like 4100000001"),
    name: z.string().describe("Full Indian name in uppercase"),
    bill_amount: z.string().describe("Bill amount with decimals like '450.00'"),
    bill_month_year: z
      .string()
      .regex(/^\d{2}\/\d{4}$/)
      .describe("Bill period in MM/YYYY format"),
    receipt_no: z.string().describe("Receipt number like PGNAXI123456"),
    receipt_date: z
      .string()
      .describe("Receipt date with weekday like 'Monday 15/12/2024'"),
    amount_debited: z.string().describe("Amount debited matching bill amount"),
    bank_transaction_no: z.number().describe("9-digit bank transaction number"),
    bank_authorisation_id: z.string().describe("Bank auth ID like TNEB0127"),
    card_type: z.string().describe("Payment method like 'AXIS NET BANKING'"),
  });

  return await generateAIData(
    schema,
    "Tamil Nadu electricity (EB) bill payment receipt data",
    n
  );
}

// Fallback generation
function generateEbBillDataFallback(n: number): EBBillData[] {
  return Array.from({ length: n }, (_, i) => {
    const billAmount = Math.floor(100 + Math.random() * 900);
    return {
      service_no: String(4100000000 + i),
      name: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`.toUpperCase(),
      bill_amount: billAmount.toFixed(2),
      bill_month_year: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${new Date().getFullYear()}`,
      receipt_no: `${randomChoice(receiptPrefixes)}${Math.floor(100000 + Math.random() * 900000)}`,
      receipt_date: `${new Date().toLocaleDateString("en-GB", { weekday: "long" })} ${new Date().toLocaleDateString("en-GB")}`,
      amount_debited: billAmount.toFixed(2),
      bank_transaction_no: Math.floor(100000000 + Math.random() * 900000000),
      bank_authorisation_id: randomChoice(bankAuthIds),
      card_type: randomChoice(cardTypes),
    };
  });
}

async function generateSingleBill(
  data: EBBillData,
  index: number
): Promise<void> {
  const baseImagePath = path.join(
    __dirname,
    "../templates",
    "EB-bill-sample-template.png"
  );
  const baseImage = await loadImage(baseImagePath);
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
  ctx.fillText(data.bank_transaction_no.toString(), 327, 167);
  ctx.fillText(data.bank_authorisation_id, 129, 196);
  ctx.fillText(data.card_type, 303, 191);

  const outputPath = path.join(outputDir, `eb_bill_${index + 1}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
}

export async function generateEBBills(
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

    let bills: EBBillData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating EB bill data using AI...");
      try {
        bills = await generateEbBillDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        bills = generateEbBillDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      bills = generateEbBillDataFallback(sample as number);
    }

    for (let i = 0; i < bills.length; i++) {
      await generateSingleBill(bills[i], i);
    }

    const zipFile = await zipImages("eb_bills", outputDir);
    console.log(`🎉 ${sample} EB bills generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate EB bills" });
  }
}
