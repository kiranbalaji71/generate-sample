// generate_gas_bills.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

// __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
// ------------------
// Helpers
// ------------------
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function formatDate(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ------------------
// Sample Data
// ------------------
const names = [
  "Ramesh Kumar",
  "Anita Sharma",
  "Suresh Reddy",
  "Priya Nair",
  "Vikram Singh",
  "Pooja Patel",
  "Rahul Verma",
  "Kavita Joshi",
  "Deepak Rao",
  "Sneha Iyer",
];
const addresses = [
  "123, MG Road\nBangalore, KA - 560001",
  "45, Park Street\nKolkata, WB - 700016",
  "78, Anna Salai\nChennai, TN - 600002",
  "12, Linking Road\nMumbai, MH - 400050",
  "5, Connaught Place\nNew Delhi - 110001",
];
const connectionTypes = ["Domestic", "Commercial"];
const orderStatuses = ["Delivered", "Pending", "Cancelled"];
const orderTypes = ["Online", "Offline"];

// ------------------
// Generate Random Gas Bill Data
// ------------------
function generateGasBillData(n = 10) {
  const data = [];
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

// ------------------
// Generate Single Gas Bill Image
// ------------------
async function generateSingleBill(data, index, baseImage, outputDir) {
  const template = await loadImage(baseImage);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.drawImage(template, 0, 0, template.width, template.height);

  // Text style
  ctx.font = "bold 10px Arial, sans-serif";
  ctx.fillStyle = "black";

  // Fill values
  ctx.fillText(data.consumer_no, 211, 145);
  ctx.fillText(data.distributor_serial_no, 211, 172);
  ctx.fillText(data.name, 211, 197);

  // Multiline address
  if (data.address) {
    const lines = data.address.split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(line, 211, 211 + i * 12);
    });
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
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
}

// ------------------
// Main Generate Function (Express API Ready)
// ------------------
export async function generateGasBills(payload, res) {
  // Clear old images
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 50;
    const records = generateGasBillData(Number(sample));
    const baseImage = path.join(
      __dirname,
      "../templates",
      "Gas-bill-sample-template.png"
    );

    for (let i = 0; i < records.length; i++) {
      await generateSingleBill(records[i], i, baseImage, outputDir);
    }

    const zipFile = await zipImages("gas_bills", outputDir);
    console.log(`🎉 ${sample} gas bills generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate gas bills" });
  }
}
