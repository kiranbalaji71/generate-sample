import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, GasBillData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Fallback data
const names = ["Ramesh Kumar", "Anita Sharma", "Suresh Reddy", "Priya Nair"];
const addresses = [
  "123, MG Road\\nBangalore, KA - 560001",
  "45, Park Street\\nKolkata, WB - 700016",
];
const connectionTypes = ["Domestic", "Commercial"];
const orderStatuses = ["Delivered", "Pending", "Cancelled"];
const orderTypes = ["Online", "Offline"];

// AI generation
async function generateGasBillDataAI(n: number): Promise<GasBillData[]> {
  const schema = z.object({
    consumer_no: z.string().describe("Consumer number like C123456"),
    distributor_serial_no: z
      .string()
      .describe("Distributor serial like D12345"),
    name: z.string().describe("Full Indian name"),
    address: z
      .string()
      .describe("Full address with newline separated city/state/pincode"),
    order_no: z.string().describe("Order number like ORD1234"),
    order_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Date in DD/MM/YYYY"),
    connection_type: z.enum(["Domestic", "Commercial"]),
    subsibidy_consumed: z
      .string()
      .describe("Subsidy consumed like '5 cylinders'"),
    kg_cyl_rs: z.string().describe("Cylinder weight like '14 Kg'"),
    price: z.string().describe("Price like '₹800'"),
    cgst: z.string().describe("CGST like '₹40'"),
    sgst: z.string().describe("SGST like '₹40'"),
    final_price: z.string().describe("Final price like '₹880'"),
    tax_invoice_no: z.string().describe("Tax invoice number like INV12345"),
    tax_invoice_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Date in DD/MM/YYYY"),
    order_status: z.enum(["Delivered", "Pending", "Cancelled"]),
    order_type: z.enum(["Online", "Offline"]),
    issue_dl: z.string().describe("Issue delivery license like DL123456"),
  });

  return await generateAIData(
    schema,
    "Indian LPG gas bill data with realistic pricing and details",
    n
  );
}

// Fallback generation
function generateGasBillDataFallback(n: number): GasBillData[] {
  const data: GasBillData[] = [];
  for (let i = 0; i < n; i++) {
    data.push({
      consumer_no: "C" + randomNumber(100000, 999999),
      distributor_serial_no: "D" + randomNumber(10000, 99999),
      name: randomChoice(names),
      address: randomChoice(addresses),
      order_no: "ORD" + randomNumber(1000, 9999),
      order_date: formatDate(new Date()),
      connection_type: randomChoice(connectionTypes),
      subsibidy_consumed: `${randomNumber(1, 12)} cylinders`,
      kg_cyl_rs: `${randomNumber(10, 15)} Kg`,
      price: `₹${randomNumber(600, 1200)}`,
      cgst: `₹${randomNumber(20, 60)}`,
      sgst: `₹${randomNumber(20, 60)}`,
      final_price: `₹${randomNumber(700, 1300)}`,
      tax_invoice_no: "INV" + randomNumber(10000, 99999),
      tax_invoice_date: formatDate(new Date()),
      order_status: randomChoice(orderStatuses),
      order_type: randomChoice(orderTypes),
      issue_dl: "DL" + randomNumber(100000, 999999),
    });
  }
  return data;
}

async function generateSingleBill(
  data: GasBillData,
  index: number,
  baseImagePath: string,
  outputDir: string
): Promise<void> {
  const template = await loadImage(baseImagePath);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(template, 0, 0, template.width, template.height);
  ctx.font = "bold 10px Arial, sans-serif";
  ctx.fillStyle = "black";

  ctx.fillText(data.consumer_no, 211, 145);
  ctx.fillText(data.distributor_serial_no, 211, 172);
  ctx.fillText(data.name, 211, 197);

  if (data.address) {
    const lines = data.address.split("\\n");
    lines.forEach((line, i) => ctx.fillText(line, 211, 211 + i * 12));
  }

  ctx.fillText(data.order_no, 211, 270);
  ctx.fillText(data.order_date, 211, 288);
  ctx.fillText(data.connection_type, 211, 305);
  ctx.fillText(data.subsibidy_consumed, 211, 322);
  ctx.fillText(data.kg_cyl_rs, 397, 160);
  ctx.fillText(data.price, 530, 179);
  ctx.fillText(data.cgst, 530, 191);
  ctx.fillText(data.sgst, 530, 203);
  ctx.fillText(data.final_price, 530, 218);
  ctx.fillText(data.tax_invoice_no, 530, 235);
  ctx.fillText(data.tax_invoice_date, 530, 250);
  ctx.fillText(data.order_status, 530, 272);
  ctx.fillText(data.order_type, 530, 295);
  ctx.fillText(data.issue_dl, 530, 322);

  const outputPath = path.join(outputDir, `gas_bill_${index + 1}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
}

export async function generateGasBills(
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

    let records: GasBillData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating gas bill data using AI...");
      try {
        records = await generateGasBillDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        records = generateGasBillDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      records = generateGasBillDataFallback(sample as number);
    }

    const baseImagePath = path.join(
      __dirname,
      "../templates",
      "Gas-bill-sample-template.png"
    );

    for (let i = 0; i < records.length; i++) {
      await generateSingleBill(records[i], i, baseImagePath, outputDir);
    }

    const zipFile = await zipImages("gas_bills", outputDir);
    console.log(`🎉 ${sample} gas bills generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate gas bills" });
  }
}
