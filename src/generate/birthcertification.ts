// src/generate/birthcertification.ts
import fs from "fs";
import path from "path";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, BirthCertificateData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const outputDir = path.join(__dirname, "../../output", "samples");
const templatePath = path.join(
  __dirname,
  "../templates",
  "birth-certificate-template.png"
);
const signaturePath = path.join(__dirname, "../templates", "signature.png");

// Ensure folder exists
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ---------------- UTILS ----------------
function randomUID(): number {
  return Math.floor(100000000000 + Math.random() * 900000000000);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

// ---------------- AI DATA GENERATION ----------------
async function generateBirthDataAI(n: number): Promise<BirthCertificateData[]> {
  const birthCertSchema = z.object({
    "Certificate No": z
      .string()
      .describe("Certificate number in format like CHN/05/2019/0001234"),
    "Name of Child": z.string().describe("Realistic Indian child name"),
    Sex: z.enum(["Male", "Female"]),
    "Date of Birth": z
      .string()
      .regex(/^\d{2}-[A-Za-z]{3}-\d{4}$/)
      .describe("Date in format DD-Mon-YYYY like 15-Jan-2020"),
    "Place of Birth": z
      .string()
      .describe("Realistic Indian hospital name and city"),
    "Name of Father": z
      .string()
      .describe("Realistic Indian father's full name"),
    "UID of Father": z.number().describe("12-digit UID number"),
    "Name of Mother": z
      .string()
      .describe("Realistic Indian mother's full name"),
    "UID of Mother": z.number().describe("12-digit UID number"),
    "Permanent Address of Parents": z
      .string()
      .describe(
        "Full Indian address with street, area, city, and valid pincode"
      ),
    "Address at Time of Birth": z
      .string()
      .describe(
        "Full Indian address with street, area, city, and valid pincode"
      ),
    "Registration Number": z
      .string()
      .describe("Registration number in format like 101/2020/12/12345"),
    "Date of Registration": z
      .string()
      .regex(/^\d{2}-[A-Za-z]{3}-\d{4}$/)
      .describe("Registration date in DD-Mon-YYYY format"),
    Remarks: z.string().describe("Usually empty or 'None'"),
    "Date of Issue": z
      .string()
      .regex(/^\d{2}-[A-Za-z]{3}-\d{4}$/)
      .describe("Issue date in DD-Mon-YYYY format"),
    "Issuing Authority": z
      .string()
      .describe(
        "Name of Indian municipal corporation like 'Greater Chennai Corporation'"
      ),
  });

  return await generateAIData(
    birthCertSchema,
    "Indian birth certificate data with authentic Indian names, addresses, and government document numbers",
    n
  );
}

// ---------------- FALLBACK DATA GENERATION ----------------
const maleNames: string[] = [
  "Arun Kumar",
  "Suresh Babu",
  "Prakash Raj",
  "Vignesh",
  "Karthik",
  "Ramesh",
];
const femaleNames: string[] = [
  "Meena",
  "Divya",
  "Lakshmi",
  "Ananya",
  "Harini",
  "Priya",
];
const fatherNames: string[] = [
  "Ramesh Kumar",
  "Sundar Raj",
  "Mohan Babu",
  "Krishnan Iyer",
];
const motherNames: string[] = ["Saranya", "Kavitha", "Geetha", "Lakshmi"];

const hospitals = [
  {
    hospital: "Government Hospital, Chennai",
    authority: "Greater Chennai Corporation",
    city: "Chennai",
    streets: ["Anna Salai", "Mount Road"],
    areas: ["T Nagar", "Mylapore"],
    pincodes: [600017, 600004],
  },
  {
    hospital: "Apollo Hospital, Madurai",
    authority: "Madurai Corporation",
    city: "Madurai",
    streets: ["KK Nagar Main Road", "Alagar Koil Road"],
    areas: ["KK Nagar", "Anna Nagar"],
    pincodes: [625020, 625007],
  },
];

type CityConfig = {
  certCode: string;
  bodyCode: number;
  wards: number[];
};

const cityConfigs: Record<string, CityConfig> = {
  Chennai: { certCode: "CHN", bodyCode: 101, wards: [11, 12, 13] },
  Madurai: { certCode: "MDU", bodyCode: 102, wards: [21, 22, 23] },
};

function generateCertificateNo(
  cityCode: string,
  issueDate: string,
  seq: number
): string {
  const [day, monStr, year] = issueDate.split("-");
  const month = new Date(`${monStr} 1, ${year}`).getMonth() + 1;
  const monthStr = String(month).padStart(2, "0");
  const seqStr = String(seq).padStart(7, "0");
  return `${cityCode}/${monthStr}/${year}/${seqStr}`;
}

function generateRegistrationNo(
  bodyCode: number,
  year: string,
  ward: number,
  serial: number
): string {
  const serialStr = String(serial).padStart(5, "0");
  return `${bodyCode}/${year}/${ward}/${serialStr}`;
}

function generateBirthDataFallback(n: number): BirthCertificateData[] {
  const rows: BirthCertificateData[] = [];
  for (let i = 0; i < n; i++) {
    const father = fatherNames[Math.floor(Math.random() * fatherNames.length)];
    let mother = motherNames[Math.floor(Math.random() * motherNames.length)];
    const sex = i % 2 === 0 ? "Male" : "Female";

    const childBaseName =
      sex === "Male"
        ? maleNames[Math.floor(Math.random() * maleNames.length)]
        : femaleNames[Math.floor(Math.random() * femaleNames.length)];

    const child = `${childBaseName} ${father.trim()[0]}`;
    mother = `${mother} ${father.trim()[0]}`;

    const fatherUID = randomUID();
    const motherUID = randomUID();

    const placeObj = hospitals[Math.floor(Math.random() * hospitals.length)];
    const hospital = placeObj.hospital;
    const authority = placeObj.authority;
    const city = placeObj.city;

    const dobDate = new Date(
      2018 + Math.floor(Math.random() * 6),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    );
    const regDate = new Date(
      dobDate.getTime() + Math.floor(Math.random() * 60) * 86400000
    );
    const issueDate = new Date(
      regDate.getTime() + Math.floor(Math.random() * 60) * 86400000
    );

    const format = (d: Date) =>
      d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");

    const dob = format(dobDate);
    const regDateStr = format(regDate);
    const issueDateStr = format(issueDate);

    const config = cityConfigs[city];
    const year = dob.split("-")[2];
    const ward = config.wards[Math.floor(Math.random() * config.wards.length)];
    const serial = 2000 + i;

    const regNo = generateRegistrationNo(config.bodyCode, year, ward, serial);
    const certNo = generateCertificateNo(config.certCode, issueDateStr, i + 1);

    const getAddress = (j: number) =>
      `No.${100 + j}, ${placeObj.streets[Math.floor(Math.random() * placeObj.streets.length)]}, ${placeObj.areas[Math.floor(Math.random() * placeObj.areas.length)]}, ${placeObj.city}-${placeObj.pincodes[Math.floor(Math.random() * placeObj.pincodes.length)]}`;

    rows.push({
      "Certificate No": certNo,
      "Name of Child": child,
      Sex: sex,
      "Date of Birth": dob,
      "Place of Birth": hospital,
      "Name of Father": father,
      "UID of Father": fatherUID,
      "Name of Mother": mother,
      "UID of Mother": motherUID,
      "Permanent Address of Parents": getAddress(i),
      "Address at Time of Birth": getAddress(i + 1),
      "Registration Number": regNo,
      "Date of Registration": regDateStr,
      Remarks: "",
      "Date of Issue": issueDateStr,
      "Issuing Authority": authority,
    });
  }
  return rows;
}

// ---------------- DRAW IMAGE ----------------
async function drawCertificate(
  data: BirthCertificateData,
  index: number,
  baseImage: any,
  signatureImage: any
): Promise<void> {
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
  ctx.drawImage(baseImage, 0, 0);

  ctx.font = "42px Arial, sans-serif";
  ctx.fillStyle = "black";

  ctx.fillText(data["Name of Child"], 1270, 1290);
  ctx.fillText(data["Sex"], 1270, 1385);
  ctx.fillText(data["Date of Birth"], 1270, 1498);
  wrapText(ctx, data["Place of Birth"], 1270, 1595, 1000, 50);

  ctx.fillText(data["Name of Father"], 1270, 1850);
  ctx.fillText(data["UID of Father"].toString(), 1270, 1955);
  ctx.fillText(data["Name of Mother"], 1270, 2048);
  ctx.fillText(data["UID of Mother"].toString(), 1270, 2145);

  wrapText(ctx, data["Permanent Address of Parents"], 1270, 2245, 1000, 50);
  wrapText(ctx, data["Address at Time of Birth"], 1270, 2435, 1000, 50);

  ctx.fillText(data["Registration Number"], 1270, 2640);
  ctx.fillText(data["Date of Registration"], 1270, 2745);
  ctx.fillText(data["Remarks"], 1270, 2848);
  ctx.fillText(data["Date of Issue"], 1270, 2935);

  ctx.drawImage(signatureImage, 1650, 2830, 250, 100);
  ctx.font = "Bold 32px Arial, sans-serif";
  ctx.fillText("Dr.M.Jagadeesan", 1650, 2955);

  ctx.font = "30px Arial, sans-serif";
  ctx.fillText(data["Issuing Authority"], 1840, 3118);

  ctx.font = "Bold 28px Arial, sans-serif";
  ctx.fillText(data["Certificate No"], 1350, 3227);

  const outPath = path.join(outputDir, `birth_certificate_${index + 1}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
}

// ---------------- MAIN EXPORT ----------------
export async function generateBirthCertificates(
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

    let data: BirthCertificateData[];

    // Try AI generation first
    if (isAIConfigured()) {
      console.log("🤖 Generating birth certificate data using AI...");
      try {
        data = await generateBirthDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback data", aiError);
        data = generateBirthDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback data");
      data = generateBirthDataFallback(sample as number);
    }

    const baseImage = await loadImage(templatePath);
    const signatureImage = await loadImage(signaturePath);

    for (let i = 0; i < data.length; i++) {
      await drawCertificate(data[i], i, baseImage, signatureImage);
    }

    const zipFile = await zipImages("birth_certificates", outputDir);
    console.log(`🎉 ${sample} birth certificates generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate birth certificates" });
  }
}
