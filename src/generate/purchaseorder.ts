import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, PurchaseOrderData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fallback data
const supplierCompanies = [
  "Supplier Company Pvt Ltd",
  "Global Traders Ltd",
  "TechWorld Distributors",
];
const buyerCompanies = [
  "Your Company Name",
  "BrightWave Solutions",
  "Vertex Enterprises",
];
const cityPinPrefixes: Record<string, string> = {
  Chennai: "60",
  Bengaluru: "56",
  Mumbai: "40",
  Hyderabad: "50",
};

function generatePincode(city: string): string {
  const prefix = cityPinPrefixes[city] || "50";
  const suffix = String(Math.floor(1000 + Math.random() * 8999));
  return `${prefix}${suffix}`;
}

const itemsCatalog = [
  { description: "Dell Laptop Inspiron 15", unit_price: 45000 },
  { description: "HP Laser Printer", unit_price: 18000 },
  { description: "Office Chair Ergonomic", unit_price: 7500 },
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Address = {
  street: string;
  city: string;
  country: string;
  pincode: string;
};

function generateAddress(city: string): Address {
  const streets = ["Anna Salai", "MGR Road", "MG Road", "Whitefield"];
  return {
    street: randomChoice(streets),
    city,
    country: "India",
    pincode: generatePincode(city),
  };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// AI generation
async function generatePOsAI(n: number): Promise<PurchaseOrderData[]> {
  const schema = z.object({
    po_number: z.string().describe("PO number like PO-2025-001"),
    po_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("PO date in DD/MM/YYYY"),
    issue_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Issue date in DD/MM/YYYY"),
    buyer: z.object({
      name: z.string().describe("Buyer company name"),
      street: z.string().describe("Street address"),
      city: z.string().describe("City"),
      country: z.string().describe("Country (India)"),
      pincode: z.string().describe("6-digit pincode"),
    }),
    supplier: z.object({
      name: z.string().describe("Supplier company name"),
      street: z.string().describe("Street address"),
      city: z.string().describe("City"),
      country: z.string().describe("Country (India)"),
      pincode: z.string().describe("6-digit pincode"),
    }),
    items: z
      .array(
        z.object({
          no: z.number().describe("Item number"),
          description: z.string().describe("Item description"),
          quantity: z.number().describe("Quantity ordered"),
          unit_price: z.number().describe("Unit price"),
          amount: z.number().describe("Total amount (quantity * unit_price)"),
        })
      )
      .describe("Array of 2-4 items"),
    subtotal: z.number().describe("Subtotal amount"),
    gst: z.number().describe("GST amount (18%)"),
    total_amount: z.number().describe("Total including GST"),
    buyer_delivery_address: z.object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      pincode: z.string(),
    }),
    buyer_delivery_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Delivery date in DD/MM/YYYY"),
    buyer_payment_terms: z
      .string()
      .describe("Payment terms like 'Net 30 days'"),
  });

  return await generateAIData(
    schema,
    "Indian purchase order with supplier, buyer, and item details",
    n
  );
}

// Fallback generation
function generatePOsFallback(n: number): PurchaseOrderData[] {
  const data: PurchaseOrderData[] = [];
  for (let i = 1; i <= n; i++) {
    const supplier = randomChoice(supplierCompanies);
    const buyer = randomChoice(buyerCompanies);
    const poNumber = `PO-2025-${String(i).padStart(3, "0")}`;
    const poDate = new Date();
    const issueDate = poDate;
    const deliveryDate = addDays(poDate, Math.floor(Math.random() * 15) + 5);

    const itemCount = Math.floor(Math.random() * 2) + 2;
    const shuffled = [...itemsCatalog].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, itemCount);

    let subtotal = 0;
    const items = selected.map((item, idx) => {
      const qty = Math.floor(Math.random() * 10) + 1;
      const amt = qty * item.unit_price;
      subtotal += amt;
      return {
        no: idx + 1,
        description: item.description,
        quantity: qty,
        unit_price: item.unit_price,
        amount: amt,
      };
    });

    const gst = +(subtotal * 0.18).toFixed(2);
    const total = subtotal + gst;

    const supplierAddr = generateAddress(
      randomChoice(Object.keys(cityPinPrefixes))
    );
    const buyerAddr = generateAddress(
      randomChoice(Object.keys(cityPinPrefixes))
    );
    const deliveryAddr =
      Math.random() > 0.5 ? buyerAddr : generateAddress(buyerAddr.city);

    data.push({
      po_number: poNumber,
      po_date: poDate.toLocaleDateString("en-GB"),
      issue_date: issueDate.toLocaleDateString("en-GB"),
      buyer: { ...buyerAddr, name: buyer },
      supplier: { ...supplierAddr, name: supplier },
      items,
      subtotal,
      gst,
      total_amount: total,
      buyer_delivery_address: deliveryAddr,
      buyer_delivery_date: deliveryDate.toLocaleDateString("en-GB"),
      buyer_payment_terms: "Net 30 days",
    });
  }
  return data;
}

async function generateSinglePO(
  data: PurchaseOrderData,
  index: number
): Promise<string> {
  const baseImage = await loadImage(
    path.join(__dirname, "../templates", "purchase-order-template.png")
  );
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 0, 0);
  ctx.font = "bold 12px Arial, sans-serif";
  ctx.fillStyle = "black";

  // Supplier
  ctx.fillText(data.supplier.name, 122, 100);
  ctx.fillText(data.supplier.street, 122, 126);
  ctx.fillText(data.supplier.city, 122, 153);
  ctx.fillText(data.supplier.country, 122, 180);
  ctx.fillText(data.supplier.pincode, 122, 206);

  // PO Number / Date
  ctx.fillText(data.po_number, 122, 248);
  ctx.fillText(data.po_date, 454, 248);

  // Buyer
  ctx.fillText(data.buyer.name, 454, 100);
  ctx.fillText(data.buyer.street, 454, 126);
  ctx.fillText(data.buyer.city, 454, 153);
  ctx.fillText(data.buyer.country, 454, 180);
  ctx.fillText(data.buyer.pincode, 454, 206);

  // Items
  let startY = 315;
  data.items.forEach((item, i) => {
    ctx.fillText(item.no.toString(), 40, startY + i * 33);
    ctx.fillText(item.description, 130, startY + i * 33);
    ctx.fillText(item.unit_price.toString(), 435, startY + i * 33);
    ctx.fillText(item.amount.toString(), 526, startY + i * 33);
  });

  // Totals
  ctx.fillText(data.total_amount.toString(), 526, 605);

  // Delivery Address
  ctx.fillText(data.buyer_delivery_address.street, 141, 645);
  ctx.fillText(data.buyer_delivery_address.city, 141, 673);
  ctx.fillText(data.buyer_delivery_address.country, 141, 700);
  ctx.fillText(data.buyer_delivery_address.pincode, 141, 726);

  // Delivery Date / Payment Terms
  ctx.fillText(data.buyer_delivery_date, 430, 666);
  ctx.fillText(data.buyer_payment_terms, 430, 716);

  // Issue Date
  ctx.fillText(data.issue_date, 482, 795);

  const filePath = path.join(outputDir, `purchase_order_${index + 1}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

export async function generatePurchaseOrders(
  payload: GeneratorPayload,
  res: Response
) {
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

    let records: PurchaseOrderData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating purchase order data using AI...");
      try {
        records = await generatePOsAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        records = generatePOsFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      records = generatePOsFallback(sample as number);
    }

    for (let i = 0; i < records.length; i++) {
      await generateSinglePO(records[i], i);
    }

    const zipFile = await zipImages("purchase_orders", outputDir);
    console.log(`🎉 ${sample} purchase orders generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating purchase orders");
  }
}
