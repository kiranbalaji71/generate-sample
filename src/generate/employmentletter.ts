import fs from "fs";
import path from "path";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, EmploymentLetterData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
function randomDateBetween(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fallback data
const companies = [
  {
    name: "Tata Consultancy Services",
    addr: "SJR Tower, Whitefield, Bangalore - 560066",
    website: "www.tcs.com",
    auth: "TCS Ltd",
  },
  {
    name: "Infosys Technologies",
    addr: "Electronics City, Hosur Road, Bangalore - 560100",
    website: "www.infosys.com",
    auth: "Infosys Ltd",
  },
];
const firstNames = ["Arun", "Neha", "Ravi", "Priya"];
const lastNames = ["Kumar", "Sharma", "Verma", "Iyer"];
const jobRoles = ["Software Engineer", "Business Analyst", "HR Executive"];
const units = ["Bangalore Unit", "Chennai Unit", "Mumbai Unit"];
const benefits = [
  "Car, Accommodation, Insurance and other perks",
  "Medical Insurance, Travel Reimbursement",
];
const reportTimes = ["08:30 a.m.", "09:00 a.m.", "09:30 a.m."];
const managers = ["Mr. A.B. Trivedi", "Ms. Meenakshi", "Mr. Raghavan"];
const signatories = [
  { name: "S.K. Venkatraman", designation: "Deputy General Manager – HR" },
  { name: "R. Krishnan", designation: "Senior HR Manager" },
];

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
  let lineArray: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lineArray.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lineArray.push(line);

  for (let k = 0; k < lineArray.length; k++) {
    ctx.fillText(lineArray[k], x, y + k * lineHeight);
  }
}

// AI generation
async function generateEmploymentDataAI(
  n: number
): Promise<EmploymentLetterData[]> {
  const schema = z.object({
    "Company Name": z.string().describe("Realistic Indian company name"),
    "Company Address": z
      .string()
      .describe("Full company address with city and pincode"),
    "Company Website": z.string().describe("Company website URL"),
    "Date of Issue": z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Date in DD/MM/YYYY format"),
    "Candidate Name": z.string().describe("Full Indian candidate name"),
    "Candidate Address": z.string().describe("Candidate residential address"),
    "Candidate Contact": z
      .string()
      .describe("10-digit Indian mobile number starting with 9/8/7"),
    "Position Offered": z
      .string()
      .describe("Job position like 'Software Engineer', 'Business Analyst'"),
    "Unit Name": z.string().describe("Business unit like 'Bangalore Unit'"),
    "Employment Type": z.enum(["Full Time", "Part Time"]),
    CTC: z.string().describe("Annual salary like 'Rs. 12,00,000 p.a.'"),
    "Other Benefits": z
      .string()
      .describe("Benefits like 'Medical Insurance, Travel Reimbursement'"),
    "Reporting Date": z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Joining date in DD/MM/YYYY"),
    "Reporting Time": z.string().describe("Reporting time like '09:00 a.m.'"),
    "Reporting Manager": z
      .string()
      .describe("Manager name with title like 'Mr. A.B. Trivedi'"),
    "Authorized Signatory Name": z.string().describe("HR signatory name"),
    "Authorized Signatory Designation": z
      .string()
      .describe("HR designation like 'Deputy General Manager – HR'"),
    "Authorized Company Name": z
      .string()
      .describe("Company legal name for authorization"),
  });

  return await generateAIData(
    schema,
    "Indian employment offer letter with realistic company and candidate data",
    n
  );
}

// Fallback generation
function generateEmploymentDataFallback(n: number): EmploymentLetterData[] {
  const data: EmploymentLetterData[] = [];
  for (let i = 0; i < n; i++) {
    const company = randomChoice(companies);
    const candidate = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
    data.push({
      "Company Name": company.name,
      "Company Address": company.addr,
      "Company Website": company.website,
      "Date of Issue": formatDate(
        randomDateBetween(new Date(2022, 0, 1), new Date())
      ),
      "Candidate Name": candidate,
      "Candidate Address": `${100 + i}, Residency Road, Bangalore`,
      "Candidate Contact": `9${Math.floor(100000000 + Math.random() * 899999999)}`,
      "Position Offered": randomChoice(jobRoles),
      "Unit Name": randomChoice(units),
      "Employment Type": Math.random() > 0.8 ? "Part Time" : "Full Time",
      CTC: `Rs. ${3 + Math.floor(Math.random() * 25)},00,000 p.a.`,
      "Other Benefits": randomChoice(benefits),
      "Reporting Date": formatDate(new Date()),
      "Reporting Time": randomChoice(reportTimes),
      "Reporting Manager": randomChoice(managers),
      "Authorized Signatory Name": randomChoice(signatories).name,
      "Authorized Signatory Designation": randomChoice(signatories).designation,
      "Authorized Company Name": company.auth,
    });
  }
  return data;
}

async function generateSingleLetter(
  data: EmploymentLetterData,
  index: number
): Promise<void> {
  const baseImagePath = path.join(
    __dirname,
    "../templates",
    "offer-letter-sample-template.png"
  );
  const baseImage = await loadImage(baseImagePath);
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

  ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
  ctx.fillStyle = "black";

  ctx.textAlign = "center";
  ctx.font = "bold 70px 'Times New Roman'";
  ctx.fillText(data["Company Name"], baseImage.width / 2, 190);

  ctx.font = "50px 'Times New Roman'";
  ctx.fillText(data["Company Address"], baseImage.width / 2, 260);

  ctx.font = "32px 'Times New Roman'";
  ctx.fillText(`Link : ${data["Company Website"]}`, baseImage.width / 2, 320);

  ctx.textAlign = "left";
  ctx.font = "bold 50px 'Times New Roman'";
  ctx.fillText(data["Date of Issue"], 2020, 435);

  ctx.fillText(data["Candidate Name"], 215, 605);
  ctx.fillText(data["Candidate Address"], 215, 660);
  ctx.fillText(data["Candidate Contact"], 215, 720);

  wrapText(
    ctx,
    `Dear ${data["Candidate Name"]}, you have been selected as ${data["Position Offered"]} at ${data["Unit Name"]}.`,
    215,
    1335,
    2200,
    60
  );

  ctx.fillText(data["Employment Type"], 985, 1570);
  wrapText(ctx, `CTC - ${data["CTC"]}`, 985, 1630, 1200, 50);
  wrapText(ctx, data["Other Benefits"], 985, 1720, 1100, 58);
  ctx.fillText(data["Reporting Date"], 985, 1820);
  ctx.fillText(data["Reporting Time"], 985, 1880);
  ctx.fillText(data["Reporting Manager"], 985, 1940);

  ctx.fillText(data["Authorized Company Name"], 215, 2655);
  ctx.fillText(data["Authorized Signatory Name"], 215, 2825);
  ctx.fillText(data["Authorized Signatory Designation"], 215, 2880);

  const filePath = path.join(outputDir, `offer_letter_${index + 1}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
}

export async function generateEmploymentLetters(
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

    let data: EmploymentLetterData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating employment letter data using AI...");
      try {
        data = await generateEmploymentDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        data = generateEmploymentDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      data = generateEmploymentDataFallback(sample as number);
    }

    for (let i = 0; i < data.length; i++) {
      await generateSingleLetter(data[i], i);
    }

    const zipFile = await zipImages("employment_letters", outputDir);
    console.log(
      `🎉 ${sample} Employment offer letters generated -> ${zipFile}`
    );

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to generate Employment offer letters" });
  }
}
