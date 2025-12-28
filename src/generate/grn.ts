import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, GRNData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fallback data
const companies = [
  "TechWorld Pvt Ltd",
  "UrbanEdge Supplies",
  "NextGen Industries",
];
const cityPinPrefixes: Record<string, string> = {
  Chennai: "60",
  Bengaluru: "56",
  Mumbai: "40",
  Hyderabad: "50",
};

type ItemTemplate = { description: string; unit_price: number };
const itemsCatalog: Record<string, ItemTemplate[]> = {
  Electronics: [
    { description: "Dell Laptop Inspiron 15", unit_price: 45000 },
    { description: "HP Laser Printer", unit_price: 18000 },
  ],
  Furniture: [
    { description: "Office Chair Ergonomic", unit_price: 7500 },
    { description: "Wooden Desk", unit_price: 15000 },
  ],
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generatePincode(city: string): string {
  const prefix = cityPinPrefixes[city] || "50";
  const suffix = String(Math.floor(1000 + Math.random() * 8999));
  return `${prefix}${suffix}`;
}
function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
function generateWebsite(companyName: string): string {
  const slug = companyName.toLowerCase().replace(/\s+/g, "");
  return `www.${slug}.com`;
}

// AI generation
async function generateGRNDataAI(count: number): Promise<GRNData[]> {
  const schema = z.object({
    company_name: z.string().describe("Company name"),
    company_website: z.string().describe("Company website URL"),
    grn_no: z.string().describe("GRN number like GRN-2025-001"),
    date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Date in DD/MM/YYYY"),
    supplier_name: z.string().describe("Supplier company name"),
    supplier_address: z.string().describe("Supplier street address"),
    supplier_city: z.string().describe("Supplier city"),
    supplier_pincode: z.string().describe("6-digit pincode"),
    po_no: z.string().describe("Purchase order number like PO-2025-001"),
    carrier_name: z.string().describe("Logistics carrier name"),
    delivery_address: z.string().describe("Delivery street address"),
    delivery_city: z.string().describe("Delivery city"),
    delivery_pincode: z.string().describe("6-digit pincode"),
    delivery_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Delivery date in DD/MM/YYYY"),
    items: z
      .array(
        z.object({
          no: z.number().describe("Item number"),
          description: z.string().describe("Item description"),
          ordered: z.number().describe("Quantity ordered"),
          received: z.number().describe("Quantity received"),
          amount: z.number().describe("Total amount for this item"),
        })
      )
      .describe("Array of 2-4 items"),
    total_amount: z.number().describe("Total amount for all items"),
    payment_method: z.enum(["Debit Card", "Credit Card", "Net Banking", "UPI"]),
  });

  return await generateAIData(
    schema,
    "Indian Goods Receipt Note (GRN) with realistic supplier and delivery details",
    count
  );
}

// Fallback generation
function generateGRNDataFallback(count: number): GRNData[] {
  const data: GRNData[] = [];
  for (let i = 1; i <= count; i++) {
    const company = randomChoice(companies);
    const companyWebsite = generateWebsite(company);
    const grnNo = `GRN-2025-${String(i).padStart(3, "0")}`;
    const today = new Date();
    const deliveryDate = addDays(today, Math.floor(Math.random() * 10) + 1);

    const supplierCity = randomChoice(Object.keys(cityPinPrefixes));
    const deliveryCity = randomChoice(Object.keys(cityPinPrefixes));

    const supplierAddr = {
      street: "Sample Street",
      city: supplierCity,
      pincode: generatePincode(supplierCity),
    };
    const deliveryAddr = {
      street: "Delivery Lane",
      city: deliveryCity,
      pincode: generatePincode(deliveryCity),
    };

    const categories = Object.keys(itemsCatalog);
    const selectedCategory = randomChoice(categories);
    const catalog = itemsCatalog[selectedCategory];
    const itemCount = Math.floor(Math.random() * 2) + 2;
    const shuffledItems = [...catalog].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, itemCount);

    let totalAmount = 0;
    const items = selectedItems.map((item, idx) => {
      const ordered = Math.floor(Math.random() * 10) + 1;
      const received = Math.max(1, ordered - Math.floor(Math.random() * 2));
      const amount = received * item.unit_price;
      totalAmount += amount;
      return {
        no: idx + 1,
        description: item.description,
        ordered,
        received,
        amount,
      };
    });

    data.push({
      company_name: company,
      company_website: companyWebsite,
      grn_no: grnNo,
      date: today.toLocaleDateString("en-GB"),
      supplier_name: "Global Traders Ltd",
      supplier_address: supplierAddr.street,
      supplier_city: supplierAddr.city,
      supplier_pincode: supplierAddr.pincode,
      po_no: `PO-${2025}-${String(i).padStart(3, "0")}`,
      carrier_name: "BlueDart Logistics",
      delivery_address: deliveryAddr.street,
      delivery_city: deliveryAddr.city,
      delivery_pincode: deliveryAddr.pincode,
      delivery_date: deliveryDate.toLocaleDateString("en-GB"),
      items,
      total_amount: totalAmount,
      payment_method: randomChoice([
        "Debit Card",
        "Credit Card",
        "Net Banking",
        "UPI",
      ]),
    });
  }
  return data;
}

async function generateSingleGRN(
  data: GRNData,
  index: number
): Promise<string> {
  const baseImage = await loadImage(
    path.join(__dirname, "../templates", "grn-sample-template.png")
  );
  const signatureImage = await loadImage(
    path.join(__dirname, "../templates", "signature.png")
  );
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillStyle = "black";

  ctx.fillText(data.company_name, 900, 165);
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillStyle = "grey";
  ctx.fillText(data.company_website, 900, 200);

  ctx.fillText(data.grn_no, 270, 333);
  ctx.fillText(data.date, 856, 333);

  ctx.fillText(data.supplier_name, 337, 408);
  ctx.fillText(data.supplier_address, 351, 441);
  ctx.fillText(data.supplier_city, 310, 473);
  ctx.fillText(data.supplier_pincode, 351, 506);
  ctx.fillText(data.po_no, 260, 540);

  ctx.fillText(data.carrier_name, 968, 408);
  ctx.fillText(data.delivery_address, 987, 441);
  ctx.fillText(data.delivery_city, 946, 473);
  ctx.fillText(data.delivery_pincode, 989, 506);
  ctx.fillText(data.delivery_date, 965, 540);

  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillStyle = "black";
  let startY = 710;
  data.items.forEach((item, i) => {
    const y = startY + i * 73;
    ctx.fillText(item.no.toString(), 172, y);
    ctx.fillText(item.description, 254, y);
    ctx.fillText(item.ordered.toString(), 653, y);
    ctx.fillText(item.received.toString(), 877, y);
    ctx.fillText(item.amount.toString(), 1119, y);
  });

  ctx.fillText(`₹ ${data.total_amount}`, 1119, 1350);
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillStyle = "grey";
  ctx.fillText(data.payment_method, 355, 1450);
  ctx.drawImage(signatureImage, 150, 1500, 300, 150);

  const outputPath = path.join(outputDir, `grn_${index + 1}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  return outputPath;
}

export const generateGRN = async (
  payload: GeneratorPayload,
  res: Response
): Promise<void> => {
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

    let records: GRNData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating GRN data using AI...");
      try {
        records = await generateGRNDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        records = generateGRNDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      records = generateGRNDataFallback(sample as number);
    }

    for (let i = 0; i < records.length; i++) {
      await generateSingleGRN(records[i], i);
    }

    const zipFile = await zipImages("grn_documents", outputDir);
    console.log("✅ GRN generation completed.");
    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to generate GRNs" });
  }
};
