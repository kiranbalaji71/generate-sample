import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, RationCardData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "../../output", "samples");
const templatePath = path.join(
  __dirname,
  "../templates",
  "ration-card-sample-template.jpg"
);
const signaturePath = path.join(__dirname, "../templates", "signature.png");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fallback data
const maleNames = ["Amit", "Ramesh", "Sunil", "Rajesh", "Vikram"];
const femaleNames = ["Anita", "Priya", "Neha", "Pooja", "Kavita"];
const lastNames = ["Sharma", "Verma", "Singh", "Gupta", "Mehta"];
const cityData = [
  { city: "Delhi", district: "New Delhi", state: "Delhi" },
  { city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh" },
];
const dealers = ["Sharma Stores", "Verma Traders", "Singh Provision"];
const wards = ["Ward 1", "Ward 2", "Ward 3"];
const ruralStatus = ["Rural", "Urban"];
const blocks = ["Block A", "Block B", "Block C"];
const subAreas = ["North Zone", "South Zone"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// AI generation
async function generateRationCardDataAI(n: number): Promise<RationCardData[]> {
  const schema = z.object({
    ration_card_no: z.string().describe("Ration card number like RC1000000001"),
    name: z.string().describe("Full Indian name"),
    father_husband: z.string().describe("Father or husband's full name"),
    head_of_family: z.string().describe("Head of family name"),
    dob: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Date in DD/MM/YYYY"),
    dealer_name: z.string().describe("Dealer store name"),
    dealer_address: z.string().describe("Dealer address city"),
    address: z.string().describe("Full residential address"),
    ward: z.string().describe("Ward number like Ward 1"),
    village_municipality: z.string().describe("City/Village name"),
    rural: z.enum(["Rural", "Urban"]),
    block: z.string().describe("Block name like Block A"),
    district: z.string().describe("District name"),
    state: z.string().describe("Indian state name"),
    pin_code: z.number().describe("6-digit pincode"),
    date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Issue date in DD/MM/YYYY"),
    sub_area: z.string().describe("Zone like North Zone"),
  });

  return await generateAIData(
    schema,
    "Indian ration card data with authentic details",
    n
  );
}

// Fallback generation
function generateRationCardDataFallback(n: number): RationCardData[] {
  const data: RationCardData[] = [];
  for (let i = 0; i < n; i++) {
    const lastName = randomChoice(lastNames);
    const cityObj = randomChoice(cityData);
    data.push({
      ration_card_no: `RC${String(1000000000 + i)}`,
      name: `${randomChoice([...maleNames, ...femaleNames])} ${lastName}`,
      father_husband: `${randomChoice(maleNames)} ${lastName}`,
      head_of_family: `${randomChoice(maleNames)} ${lastName}`,
      dob: new Date(1950 + Math.random() * 50, 0, 1).toLocaleDateString(
        "en-GB"
      ),
      dealer_name: randomChoice(dealers),
      dealer_address: cityObj.city,
      address: `${Math.floor(Math.random() * 500)} ${lastName} Street`,
      ward: randomChoice(wards),
      village_municipality: cityObj.city,
      rural: randomChoice(ruralStatus),
      block: randomChoice(blocks),
      district: cityObj.district,
      state: cityObj.state,
      pin_code: Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleDateString("en-GB"),
      sub_area: randomChoice(subAreas),
    });
  }
  return data;
}

async function generateCardImage(
  data: RationCardData,
  index: number,
  baseImage: any,
  signatureImage: any
): Promise<void> {
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
  ctx.fillText(data.pin_code.toString(), 239, 1635);
  ctx.fillText(data.date, 239, 1690);
  ctx.fillText(data.sub_area, 251, 1740);

  ctx.drawImage(signatureImage, 998, 1600, 250, 100);

  const outPath = path.join(outputDir, `ration_card_${index + 1}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
}

export async function generateRationCards(
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

    let data: RationCardData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating ration card data using AI...");
      try {
        data = await generateRationCardDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        data = generateRationCardDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      data = generateRationCardDataFallback(sample as number);
    }

    const baseImage = await loadImage(templatePath);
    const signatureImage = await loadImage(signaturePath);

    for (let i = 0; i < data.length; i++) {
      await generateCardImage(data[i], i, baseImage, signatureImage);
    }

    const zipFile = await zipImages("ration_cards", outputDir);
    console.log(`🎉 ${sample} ration cards generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate ration cards" });
  }
}
