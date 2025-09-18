// generate_purchase_orders.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure output dir exists
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ---- Sample Data ----
const supplierCompanies = [
  "Supplier Company Pvt Ltd",
  "Global Traders Ltd",
  "TechWorld Distributors",
  "Future Supplies Inc",
  "UrbanEdge Suppliers",
];

const buyerCompanies = [
  "Your Company Name",
  "BrightWave Solutions",
  "Vertex Enterprises",
  "NextGen Industries",
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

function generatePincode(city) {
  const prefix = cityPinPrefixes[city] || "50";
  const suffix = String(Math.floor(1000 + Math.random() * 8999));
  return `${prefix}${suffix}`;
}

const itemsCatalog = [
  { description: "Dell Laptop Inspiron 15", unit_price: 45000 },
  { description: "HP Laser Printer", unit_price: 18000 },
  { description: "Logitech Wireless Mouse", unit_price: 800 },
  { description: "Samsung 24-inch Monitor", unit_price: 12000 },
  { description: "Office Chair Ergonomic", unit_price: 7500 },
  { description: "External Hard Drive 1TB", unit_price: 5000 },
];

// Helpers
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateAddress(city) {
  const streets = [
    "Anna Salai",
    "MGR Road",
    "MG Road",
    "Connaught Place",
    "Whitefield",
    "Banjara Hills",
    "Park Street",
    "Andheri West",
  ];
  return {
    street: randomChoice(streets),
    city,
    country: "India",
    pincode: generatePincode(city),
  };
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ---- Data Generator ----
function generatePOs(n = 5) {
  const data = [];
  for (let i = 1; i <= n; i++) {
    const supplier = randomChoice(supplierCompanies);
    const buyer = randomChoice(buyerCompanies);

    const poNumber = `PO-2025-${String(i).padStart(3, "0")}`;
    const poDate = new Date();
    const issueDate = poDate;
    const deliveryDate = addDays(poDate, Math.floor(Math.random() * 15) + 5);

    // Pick items
    const itemCount = Math.floor(Math.random() * 3) + 2;
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

// ---- Image Renderer ----
async function generateSinglePO(data, index) {
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

  // Save
  const filePath = path.join(outputDir, `purchase_order_${index + 1}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

// ---- Express Route ----
export async function generatePurchaseOrders(payload, res) {
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 10;
    const records = generatePOs(sample);

    // Generate images
    const imagePaths = [];
    for (let i = 0; i < records.length; i++) {
      const img = await generateSinglePO(records[i], i);
      imagePaths.push(img);
    }

    const zipFile = await zipImages("purchase_orders", outputDir);
    console.log(`🎉 ${sample} purchase orders generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating purchase orders");
  }
}
