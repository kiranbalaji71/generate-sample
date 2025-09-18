import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const outputDir = path.join(__dirname, "../../output", "samples");
const templatePath = path.join(
  __dirname,
  "../templates",
  "ration-card-sample-template.jpg"
);
const signaturePath = path.join(__dirname, "../templates", "signature.png");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
} else {
  // Clear old files before generating
  fs.readdirSync(outputDir).forEach((file) => {
    fs.unlinkSync(path.join(outputDir, file));
  });
}

// --- Sample Data ---
const maleNames = [
  "Amit",
  "Ramesh",
  "Sunil",
  "Rajesh",
  "Vikram",
  "Suresh",
  "Rohan",
  "Aakash",
  "Manish",
  "Deepak",
];
const femaleNames = [
  "Anita",
  "Priya",
  "Neha",
  "Pooja",
  "Kavita",
  "Shreya",
  "Ananya",
  "Ritu",
  "Meena",
  "Nisha",
];
const lastNames = [
  "Sharma",
  "Verma",
  "Singh",
  "Gupta",
  "Mehta",
  "Chopra",
  "Joshi",
  "Kapoor",
  "Agarwal",
];
const cityData = [
  { city: "Delhi", district: "New Delhi", state: "Delhi" },
  { city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh" },
  { city: "Jaipur", district: "Jaipur", state: "Rajasthan" },
  { city: "Chandigarh", district: "Chandigarh", state: "Chandigarh" },
  { city: "Patna", district: "Patna", state: "Bihar" },
];
const dealers = [
  "Sharma Stores",
  "Verma Traders",
  "Singh Provision",
  "Gupta Kirana",
  "Rajesh Traders",
];
const wards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];
const ruralStatus = ["Rural", "Urban"];
const blocks = ["Block A", "Block B", "Block C", "Block D"];
const subAreas = ["North Zone", "South Zone", "East Zone", "West Zone"];

// --- Helpers ---
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateRandomDOB(startYear = 1950, endYear = 2000) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}
function generateIssueDate(dob) {
  const minIssue = new Date(dob.getTime() + 18 * 365 * 24 * 60 * 60 * 1000);
  return new Date(
    minIssue.getTime() + Math.random() * (Date.now() - minIssue.getTime())
  );
}
function formatDate(date) {
  return date.toLocaleDateString("en-GB");
}
function generateRationCardNumber(index) {
  return `RC${String(1000000000 + index)}`;
}
function generateRandomPin() {
  return Math.floor(100000 + Math.random() * 900000);
}

// --- Generate dataset ---
function generateRationCardData(n = 100) {
  const data = [];
  for (let i = 0; i < n; i++) {
    const lastName = randomChoice(lastNames);
    const allNames = [...maleNames, ...femaleNames];
    const dob = generateRandomDOB();
    const issueDate = generateIssueDate(dob);
    const cityObj = randomChoice(cityData);

    data.push({
      ration_card_no: generateRationCardNumber(i),
      name: `${randomChoice(allNames)} ${lastName}`,
      father_husband: `${randomChoice(maleNames)} ${lastName}`,
      head_of_family: `${randomChoice(maleNames)} ${lastName}`,
      dob: formatDate(dob),
      dealer_name: randomChoice(dealers),
      dealer_address: cityObj.city,
      address: `${Math.floor(Math.random() * 500)} ${lastName} Street`,
      ward: randomChoice(wards),
      village_municipality: cityObj.city,
      rural: randomChoice(ruralStatus),
      block: randomChoice(blocks),
      district: cityObj.district,
      state: cityObj.state,
      pin_code: generateRandomPin(),
      date: formatDate(issueDate),
      sub_area: randomChoice(subAreas),
    });
  }
  return data;
}

// --- Draw ration card ---
async function generateCardImage(data, index, baseImage, signatureImage) {
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
  ctx.font = "bold 36px Arial, sans-serif";
  ctx.fillStyle = "black";

  ctx.fillText(data.ration_card_no, 705, 250);
  ctx.fillText(data.name, 510, 355);
  ctx.fillText(data.father_husband, 580, 415);
  ctx.fillText(data.head_of_family, 407, 473);
  ctx.fillText(data.dob, 308, 535);
  ctx.fillText(data.dealer_name, 316, 585);
  ctx.fillText(data.dealer_address, 356, 700);
  ctx.fillText(data.address, 227, 1380);
  ctx.fillText(data.ward, 233, 1420);
  ctx.fillText(data.village_municipality, 400, 1463);
  ctx.fillText(data.rural, 667, 1505);
  ctx.fillText(data.block, 242, 1550);
  ctx.fillText(data.district, 238, 1590);
  ctx.fillText(data.pin_code, 239, 1635);
  ctx.fillText(data.date, 239, 1690);
  ctx.fillText(data.sub_area, 251, 1740);

  ctx.drawImage(signatureImage, 998, 1600, 250, 100);

  const outPath = path.join(outputDir, `ration_card_${index + 1}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
}

// --- Main function (API) ---
export async function generateRationCards(payload, res) {
  // Clear old images
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 50;
    const data = generateRationCardData(sample);

    // Load template + signature
    const baseImage = await loadImage(templatePath);
    const signatureImage = await loadImage(signaturePath);

    // Draw images
    for (let i = 0; i < data.length; i++) {
      await generateCardImage(data[i], i, baseImage, signatureImage);
    }

    // Create zip
    const zipFile = await zipImages("ration_cards", outputDir);
    console.log(`🎉 ${sample} ration cards generated -> ${zipFile}`);

    // Return file
    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate ration cards" });
  }
}
