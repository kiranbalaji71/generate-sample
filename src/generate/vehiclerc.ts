import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, VehicleRCData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fallback data (simplified for brevity)
const vehicleMapping: Record<string, { models: string[]; fuels: string[] }> = {
  "Motor Car(LMV)": {
    models: ["WAGON R LXI", "SWIFT VDI"],
    fuels: ["PETROL", "DIESEL"],
  },
  Motorcycle: {
    models: ["Pulsar 150", "Royal Enfield Classic"],
    fuels: ["PETROL"],
  },
};
const issuingAuthorities = [
  "Faridabad, Haryana",
  "Mumbai, Maharashtra",
  "Chennai, Tamil Nadu",
];
const stateCodeMap: Record<string, string> = {
  "Faridabad, Haryana": "HR",
  "Mumbai, Maharashtra": "MH",
};
const colors = ["WHITE", "BLACK", "RED", "BLUE"];
const firstNames = ["Amit", "Anita", "Ramesh"];
const lastNames = ["Kumar", "Sharma", "Patel"];
const financers = ["HDFC BANK LTD", "ICICI BANK", ""];
const insuranceCompanies = ["UNITED INDIA INSURANCE CO.LTD", "ICICI LOMBARD"];

const randomChoice = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// AI generation
async function generateRcDataAI(n: number): Promise<VehicleRCData[]> {
  const schema = z.object({
    "Issuing Authority": z
      .string()
      .describe("Authority like 'Faridabad, Haryana'"),
    "Registration Number": z.string().describe("Reg number like HR01AB1234"),
    "Registration Date": z.string().describe("Date like 15-Jan-2020"),
    "Vehicle Class": z
      .string()
      .describe("Class like 'Motor Car(LMV)' or 'Motorcycle'"),
    "Vehicle Model": z.string().describe("Model like 'WAGON R LXI'"),
    "Fuel Type": z.enum(["PETROL", "DIESEL", "EV", "CNG"]),
    "Vehicle Color": z.enum([
      "WHITE",
      "BLACK",
      "RED",
      "BLUE",
      "SILVER",
      "GREY",
    ]),
    "Chassis Number": z.string().describe("Chassis number like MA12345678"),
    "Engine Number": z.string().describe("Engine number like EN123456"),
    "Month/Year of Mfg": z
      .string()
      .describe("Manufacturing date like '6/2020'"),
    "Cubic Capacity": z.string().describe("Engine capacity like '1200.00'"),
    "Owner Name": z.string().describe("Indian owner name"),
    "S/W/D Name": z.string().describe("Spouse/parent name"),
    "Present Address": z.string().describe("Full address with pincode"),
    "Permanent Address": z.string().describe("Full address with pincode"),
    "Name of Financer": z.string().describe("Financer name or empty string"),
    "RC Status": z.enum(["ACTIVE", "INACTIVE"]),
    "RC Blacklist Status": z.string().describe("Empty or 'YES'"),
    "Tax Up To": z.string().describe("Tax validity date"),
    "Owner Sno": z.string().describe("Owner serial number"),
    "Insurance Company": z.string().describe("Insurance company name"),
    "Policy Number": z.string().describe("16-digit policy number"),
    "Insurance Valid Upto": z.string().describe("Insurance expiry date"),
    "PUC Certificate Number": z.string().describe("PUC number like PUC1234"),
    "PUC Valid Upto": z.string().describe("PUC validity date"),
    "Fitness Certificate Valid Upto": z
      .string()
      .describe("Fitness validity date"),
    "Digital Signature Date": z.string().describe("Timestamp with IST"),
  });

  return await generateAIData(
    schema,
    "Indian vehicle registration certificate (RC) with complete details",
    n
  );
}

// Fallback generation (simplified)
function generateRcDataFallback(n: number): VehicleRCData[] {
  const data: VehicleRCData[] = [];
  for (let i = 0; i < n; i++) {
    const issuingAuthority = randomChoice(issuingAuthorities);
    const vehicleClass = randomChoice(Object.keys(vehicleMapping));
    data.push({
      "Issuing Authority": issuingAuthority,
      "Registration Number": `${stateCodeMap[issuingAuthority] || "XX"}01AB${1000 + i}`,
      "Registration Date": `15-Jan-${2018 + (i % 6)}`,
      "Vehicle Class": vehicleClass,
      "Vehicle Model": randomChoice(vehicleMapping[vehicleClass].models),
      "Fuel Type": randomChoice(vehicleMapping[vehicleClass].fuels),
      "Vehicle Color": randomChoice(colors),
      "Chassis Number":
        "MA" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      "Engine Number": "EN" + (100000 + Math.floor(Math.random() * 900000)),
      "Month/Year of Mfg": `${Math.floor(1 + Math.random() * 12)}/${2015 + Math.floor(Math.random() * 10)}`,
      "Cubic Capacity": (800 + Math.floor(Math.random() * 2000)).toFixed(2),
      "Owner Name": `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
      "S/W/D Name": `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
      "Present Address": `NO ${Math.floor(Math.random() * 500)}, MG Road, India-${100000 + Math.floor(Math.random() * 899999)}`,
      "Permanent Address": `NO ${Math.floor(Math.random() * 500)}, Anna Salai, India-${100000 + Math.floor(Math.random() * 899999)}`,
      "Name of Financer": randomChoice(financers),
      "RC Status": "ACTIVE",
      "RC Blacklist Status": Math.random() > 0.9 ? "YES" : "",
      "Tax Up To": `15-Jan-${2025 + Math.floor(Math.random() * 10)}`,
      "Owner Sno": (1 + Math.floor(Math.random() * 3)).toString(),
      "Insurance Company": randomChoice(insuranceCompanies),
      "Policy Number": String(
        1000000000000000n + BigInt(Math.floor(Math.random() * 9000000000000000))
      ),
      "Insurance Valid Upto": `15-Jan-${2024 + Math.floor(Math.random() * 6)}`,
      "PUC Certificate Number":
        "PUC" + (1000 + Math.floor(Math.random() * 9000)),
      "PUC Valid Upto": `15-Jan-${2024 + Math.floor(Math.random() * 4)}`,
      "Fitness Certificate Valid Upto": `15-Jan-${2024 + Math.floor(Math.random() * 10)}`,
      "Digital Signature Date":
        new Date().toLocaleString("en-GB").replace(/ /g, "-") + " IST",
    });
  }
  return data;
}

async function generateSingleRC(
  data: VehicleRCData,
  index: number
): Promise<string> {
  const baseImage = await loadImage(
    path.join(__dirname, "../templates/rc-sample-template.png")
  );
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(baseImage, 0, 0);
  ctx.font = "36px Arial, sans-serif";
  ctx.fillStyle = "black";
  ctx.fillText(data["Issuing Authority"], 710, 330);
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText(data["Registration Number"], 295, 462);
  ctx.fillText(data["Registration Date"], 965, 462);
  ctx.fillText(data["Vehicle Class"], 295, 502);
  ctx.fillText(data["Vehicle Model"], 965, 502);
  ctx.fillText(data["Fuel Type"], 295, 542);
  ctx.fillText(data["Vehicle Color"], 965, 542);
  ctx.fillText(data["Chassis Number"], 295, 578);
  ctx.fillText(data["Engine Number"], 965, 578);
  ctx.fillText(data["Month/Year of Mfg"], 295, 618);
  ctx.fillText(data["Cubic Capacity"], 965, 618);
  ctx.fillText(data["Owner Name"], 295, 688);
  ctx.fillText(data["S/W/D Name"], 965, 688);
  ctx.fillText(data["Present Address"], 295, 728);
  ctx.fillText(data["Permanent Address"], 295, 768);
  ctx.fillText(data["Name of Financer"], 295, 836);
  ctx.fillText(data["RC Status"], 295, 874);
  ctx.fillText(data["RC Blacklist Status"], 965, 874);
  ctx.fillText(data["Tax Up To"], 295, 912);
  ctx.fillText(data["Owner Sno"], 965, 912);
  ctx.fillText(data["Insurance Company"], 295, 1010);
  ctx.fillText(data["Policy Number"], 295, 1048);
  ctx.fillText(data["Insurance Valid Upto"], 965, 1048);
  ctx.fillText(data["PUC Certificate Number"], 295, 1144);
  ctx.fillText(data["PUC Valid Upto"], 965, 1144);
  ctx.fillText(data["Fitness Certificate Valid Upto"], 305, 1280);
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(data["Digital Signature Date"], 1056, 1550);

  const outputPath = path.join(outputDir, `rc_card_${index + 1}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  return outputPath;
}

export async function generateVehicleRC(
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

    let records: VehicleRCData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating vehicle RC data using AI...");
      try {
        records = await generateRcDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        records = generateRcDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      records = generateRcDataFallback(sample as number);
    }

    for (let i = 0; i < records.length; i++) {
      await generateSingleRC(records[i], i);
    }

    const zipFile = await zipImages("vehicle_registration", outputDir);
    console.log(
      `🎉 ${sample} vehicle registration certificates generated -> ${zipFile}`
    );

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating Vehicle RC");
  }
}
