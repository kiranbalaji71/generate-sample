// routes/generate_grn.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output folder for images
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Sample data
const companies = [
  "TechWorld Pvt Ltd",
  "UrbanEdge Supplies",
  "NextGen Industries",
  "BrightWave Solutions",
  "Summit Business Corp",
];

const cityPinPrefixes = {
  Chennai: "60",
  Bengaluru: "56",
  Mumbai: "40",
  Hyderabad: "50",
  Delhi: "11",
  Pune: "41",
  Kolkata: "70",
};

const itemsCatalog = {
  Electronics: [
    { description: "Dell Laptop Inspiron 15", unit_price: 45000 },
    { description: "HP Laser Printer", unit_price: 18000 },
    { description: "Logitech Wireless Mouse", unit_price: 800 },
    { description: "Samsung 24-inch Monitor", unit_price: 12000 },
    { description: "External Hard Drive 1TB", unit_price: 5000 },
  ],
  Furniture: [
    { description: "Office Chair Ergonomic", unit_price: 7500 },
    { description: "Wooden Desk", unit_price: 15000 },
    { description: "Steel Filing Cabinet", unit_price: 8500 },
    { description: "Conference Table", unit_price: 22000 },
    { description: "Visitor Sofa Set", unit_price: 30000 },
  ],
  Stationery: [
    { description: "A4 Paper Ream (500 sheets)", unit_price: 350 },
    { description: "Ballpoint Pens (Pack of 10)", unit_price: 120 },
    { description: "Notebooks (Set of 5)", unit_price: 450 },
    { description: "Whiteboard Markers (Pack of 4)", unit_price: 200 },
    { description: "Stapler with Pins", unit_price: 180 },
  ],
};

// Helpers
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generatePincode(city) {
  const prefix = cityPinPrefixes[city] || "50";
  const suffix = String(Math.floor(1000 + Math.random() * 8999));
  return `${prefix}${suffix}`;
}
function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
function generateWebsite(companyName) {
  const slug = companyName.toLowerCase().replace(/\s+/g, "");
  return `www.${slug}.com`;
}
function generateGRNData(count) {
  const data = [];
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
    const itemCount = Math.floor(Math.random() * 3) + 2;
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

// Generate one GRN image
async function generateSingleGRN(data, index) {
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
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

// Main API
export const generateGRN = async (payload, res) => {
  // Clear old files
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 50;
    const records = generateGRNData(Number(sample));

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
