import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const outputDir = path.join(__dirname, "../../output", "samples");
const templatePath = path.join(
  __dirname,
  "../templates",
  "pan-card-template.jpeg"
);

// Ensure directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
} else {
  // Clear old files before generating
  fs.readdirSync(outputDir).forEach((file) => {
    fs.unlinkSync(path.join(outputDir, file));
  });
}

// Sample name data
const trustNames = [
  "Shree Ram Trust",
  "Saraswathi Educational Trust",
  "Lakshmi Charitable Trust",
  "Vivekananda Welfare Trust",
  "Annapoorna Foundation Trust",
  "Sai Seva Trust",
  "Kalyan Social Trust",
  "Bharathi Memorial Trust",
  "Santhosh Welfare Trust",
  "Sundaram Trust",
];

const companyPrefixes = [
  "Greenfield",
  "BrightWave",
  "BlueOcean",
  "NextGen",
  "FutureTech",
  "Global",
  "Quantum",
  "EcoSmart",
  "Vertex",
  "Summit",
  "SilverLine",
  "Visionary",
  "Infinity",
  "Crystal",
  "RapidGrow",
  "UrbanEdge",
  "Solaris",
  "Nimbus",
  "Everest",
  "Apex",
];

const companySuffixes = [
  "Industries",
  "Solutions Ltd",
  "Technologies Pvt Ltd",
  "Enterprises",
  "Corporation",
  "Global Ltd",
  "Systems",
  "Group",
  "Holdings",
  "International",
  "Exports",
  "Imports",
  "Logistics",
  "Agro Industries",
  "Healthcare Pvt Ltd",
  "Energy Ltd",
  "Constructions",
];

// Utility: Random date between 1980 and 2020
function generateRandomDate() {
  const start = new Date(1980, 0, 1);
  const end = new Date(2020, 11, 31);
  const randomTime =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const randomDate = new Date(randomTime);
  return randomDate.toLocaleDateString("en-GB"); // DD/MM/YYYY
}

// Utility: Generate PAN with 4th char fixed
function generatePAN(type = "pan_company") {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const fourthChar = type === "pan_trust" ? "T" : "C";

  return (
    Array.from(
      { length: 3 },
      () => letters[Math.floor(Math.random() * letters.length)]
    ).join("") +
    fourthChar +
    letters[Math.floor(Math.random() * letters.length)] +
    Array.from(
      { length: 4 },
      () => digits[Math.floor(Math.random() * digits.length)]
    ).join("") +
    letters[Math.floor(Math.random() * letters.length)]
  );
}

function generateTrustName() {
  return trustNames[Math.floor(Math.random() * trustNames.length)];
}

function generateCompanyName() {
  const prefix =
    companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const suffix =
    companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  return `${prefix} ${suffix}`;
}

function generatePanData(n, type) {
  const data = [];
  for (let i = 0; i < n; i++) {
    const name =
      type === "pan_trust" ? generateTrustName() : generateCompanyName();
    data.push({
      name,
      date: generateRandomDate(),
      pan_no: generatePAN(type),
    });
  }
  return data;
}

async function generateImage(row, index, baseImage) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "black";

  ctx.fillText(row.name, 30, 200);
  ctx.fillText(row.date, 30, 320);
  ctx.fillText(row.pan_no, 30, 420);

  const outputPath = path.join(outputDir, `pan_card_${index + 1}.png`);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Image generated: pan_card_${index + 1}.png`);
}

// Main generator function
export async function generatePANcards(payload, res) {
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((file) => {
      fs.unlinkSync(path.join(outputDir, file));
    });
  }

  try {
    const sample = parseInt(payload.sample) || 50;
    const type = payload.type || "pan_company";
    const panData = generatePanData(sample, type);

    // Load base image
    const baseImage = await loadImage(templatePath);

    // Generate images
    for (let i = 0; i < panData.length; i++) {
      await generateImage(panData[i], i, baseImage);
    }

    const label = type === "pan_company" ? "company" : "trust";

    // Create zip
    const zipFile = await zipImages(`pan_cards_of_${label}`, outputDir);

    console.log(`🎉 All PAN cards generated and zipped: ${zipFile}`);

    // Send zip file as response
    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PAN cards" });
  }
}
