import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { Response } from "express";
import { z } from "zod";
import { zipImages } from "../helper/common.js";
import { GeneratorPayload, SalarySlipData } from "../types/index.js";
import { generateAIData, isAIConfigured } from "../lib/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fallback data
type Company = { name: string; city: string; addr: string; pfCode: string };
const companies: Company[] = [
  {
    name: "CAPCO WATER SOLUTIONS PVT LTD - MUMBAI",
    city: "Mumbai",
    addr: "15/AJ, Laxmi Estate, Andheri W, Mumbai - 400053",
    pfCode: "MH",
  },
  {
    name: "INFOTECH SYSTEMS LTD - BANGALORE",
    city: "Bangalore",
    addr: "100, MG Road, Bangalore - 560001",
    pfCode: "KA",
  },
];
const firstNames = ["Arun", "Suresh", "Neha", "Ravi"];
const lastNames = ["Kumar", "Sharma", "Verma", "Iyer"];
const departments = ["HR", "Finance", "Sales", "IT"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function f(num: number): string {
  return num.toFixed(2);
}
function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  if (num === 0) return "Zero";
  function toWords(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return ones[Math.floor(n / 100)] + " Hundred " + toWords(n % 100);
    if (n < 100000)
      return toWords(Math.floor(n / 1000)) + " Thousand " + toWords(n % 1000);
    return String(n);
  }
  return toWords(num).replace(/\s+/g, " ").trim();
}
function randomMonthYear() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const now = new Date();
  const year = now.getFullYear() - Math.floor(Math.random() * 5);
  const month = months[Math.floor(Math.random() * 12)];
  return { month, year };
}
function wrapText(
  ctx: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let lineArray = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
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
async function generateSalaryDataAI(n: number): Promise<SalarySlipData[]> {
  const schema = z.object({
    companyName: z.string().describe("Company name with city"),
    companyAddr: z.string().describe("Full company address"),
    empId: z.string().describe("Employee ID like KA1001"),
    empName: z.string().describe("Employee full name"),
    pfNo: z.string().describe("PF number like KA/12345/10001"),
    uan: z.string().describe("12-digit UAN"),
    esiNo: z.string().describe("ESI number like KA/ESI/1000000001"),
    present: z.number().describe("Days present (20-28)"),
    absent: z.number().describe("Days absent (2-10)"),
    doj: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe("Date of joining in DD/MM/YYYY"),
    department: z.string().describe("Department name"),
    branch: z.string().describe("Branch like 'Mumbai Branch'"),
    month: z.string().describe("Month like 'Jan' or 'Feb'"),
    year: z.number().describe("Year like 2024"),
    earnings: z.object({
      basicAmt: z.number(),
      daAmt: z.number(),
      hraAmt: z.number(),
      specialAmt: z.number(),
      medicalAmt: z.number(),
      transportAmt: z.number(),
      eduAmt: z.number(),
    }),
    earningsRate: z.object({
      basic: z.number(),
      da: z.number(),
      hra: z.number(),
      special: z.number(),
      medical: z.number(),
      transport: z.number(),
      edu: z.number(),
    }),
    deductions: z.object({
      pf: z.number(),
      esi: z.number(),
      pt: z.number(),
      tds: z.number(),
      adv: z.number(),
    }),
    totalRate: z.number(),
    totalAmt: z.number(),
    totalDeductions: z.number(),
    net: z.number(),
    netWords: z.string().describe("Net salary in words"),
    company: z.object({
      name: z.string(),
      city: z.string(),
      addr: z.string(),
      pfCode: z.string(),
    }),
  });

  return await generateAIData(
    schema,
    "Indian salary slip with detailed earnings and deductions",
    n
  );
}

// Fallback generation
function generateSalaryDataFallback(n: number): SalarySlipData[] {
  const data: SalarySlipData[] = [];
  for (let i = 1; i <= n; i++) {
    const company = companies[i % companies.length];
    const { month, year } = randomMonthYear();
    const empName = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
    const empId = `${company.pfCode}${1000 + i}`;
    const pfNo = `${company.pfCode}/12345/${10000 + i}`;
    const uan = String(100000000000 + i);
    const esiNo = `${company.pfCode}/ESI/${1000000000 + i}`;
    const present = 26 - (i % 3);
    const absent = 30 - present;
    const doj = `${String((i % 28) + 1).padStart(2, "0")}/${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${2018 + (i % 6)}`;
    const gross = 20000 + (i % 60) * 1000;
    const basic = gross * 0.4,
      da = gross * 0.1,
      hra = gross * 0.2,
      special = gross * 0.15,
      medical = gross * 0.07,
      transport = gross * 0.08,
      edu = 1500;
    const totalRate = basic + da + hra + special + medical + transport + edu;
    const totalAmt = totalRate * 0.9;
    const ratio = totalAmt / totalRate;
    const basicAmt = basic * ratio,
      daAmt = da * ratio,
      hraAmt = hra * ratio,
      specialAmt = special * ratio,
      medicalAmt = medical * ratio,
      transportAmt = transport * ratio,
      eduAmt = edu * ratio;
    const pf = basic * 0.12;
    const esi = gross < 21000 ? gross * 0.0175 : 0;
    const pt = gross > 15000 ? 200 : 0;
    const tds = gross > 50000 ? gross * 0.1 : 0;
    const adv = i % 25 === 0 ? 1000 : 0;
    const deductionsArr = pf + esi + pt + tds + adv;
    const net = totalAmt - deductionsArr;
    const netWords = `Rupees ${numberToWords(Math.floor(net))} Only`;
    data.push({
      company,
      empId,
      empName,
      pfNo,
      uan,
      esiNo,
      present,
      absent,
      doj,
      department: randomChoice(departments),
      branch: company.city + " Branch",
      earnings: {
        basicAmt,
        daAmt,
        hraAmt,
        specialAmt,
        medicalAmt,
        transportAmt,
        eduAmt,
      },
      earningsRate: { basic, da, hra, special, medical, transport, edu },
      deductions: { pf, esi, pt, tds, adv },
      totalRate,
      totalAmt,
      totalDeductions: deductionsArr,
      net,
      netWords,
      month,
      year,
      companyName: company.name,
      companyAddr: company.addr,
    });
  }
  return data;
}

async function generateSinglePayslip(
  data: SalarySlipData,
  index: number,
  outputDir: string
): Promise<void> {
  const baseImage = await loadImage(
    path.join(__dirname, "../templates", "salary-slip-sample-template.png")
  );
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(baseImage, 0, 0);
  ctx.fillStyle = "black";

  ctx.font = "Bold 50px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(data.companyName, 1270, 500);
  ctx.fillText(data.companyAddr, 1270, 570);
  ctx.fillText(
    `Salary Slip for the month of ${data.month} / ${data.year}`,
    1270,
    635
  );

  ctx.textAlign = "left";
  ctx.font = "40px Arial, sans-serif";
  ctx.fillText(data.empId, 522, 755);
  ctx.fillText(data.empName, 1582, 755);
  ctx.fillText(data.pfNo, 522, 815);
  ctx.fillText(data.esiNo, 1580, 815);
  ctx.fillText(data.present.toString(), 522, 875);
  ctx.fillText(data.doj, 1585, 870);
  ctx.fillText(data.department, 522, 930);
  ctx.fillText(data.branch, 1585, 930);
  ctx.fillText(data.uan, 522, 985);
  ctx.fillText(data.absent.toString(), 1585, 985);

  ctx.textAlign = "right";
  let earningsStartY = 1140,
    rowGap = 54,
    rateX = 900,
    amountX = 1350;
  const e = data.earnings,
    r = data.earningsRate;
  ctx.fillText(f(r.basic), rateX, earningsStartY);
  ctx.fillText(f(e.basicAmt), amountX, earningsStartY);
  ctx.fillText(f(r.da), rateX, earningsStartY + rowGap);
  ctx.fillText(f(e.daAmt), amountX, earningsStartY + rowGap);
  ctx.fillText(f(r.edu), rateX, earningsStartY + rowGap * 2);
  ctx.fillText(f(e.eduAmt), amountX, earningsStartY + rowGap * 2);
  ctx.fillText(f(r.hra), rateX, earningsStartY + rowGap * 3);
  ctx.fillText(f(e.hraAmt), amountX, earningsStartY + rowGap * 3);
  ctx.fillText(f(r.special), rateX, earningsStartY + rowGap * 4);
  ctx.fillText(f(e.specialAmt), amountX, earningsStartY + rowGap * 4);
  ctx.fillText(f(r.medical), rateX, earningsStartY + rowGap * 5);
  ctx.fillText(f(e.medicalAmt), amountX, earningsStartY + rowGap * 5);
  ctx.fillText(f(r.transport), rateX, earningsStartY + rowGap * 6);
  ctx.fillText(f(e.transportAmt), amountX, earningsStartY + rowGap * 6);

  const d = data.deductions,
    dStartX = 2300,
    dStartY = 1140;
  ctx.fillText(f(d.pf), dStartX, dStartY);
  ctx.fillText(f(d.esi), dStartX, dStartY + rowGap);
  ctx.fillText(f(d.pt), dStartX, dStartY + rowGap * 2);
  ctx.fillText(f(d.tds), dStartX, dStartY + rowGap * 3);
  ctx.fillText(f(d.adv), dStartX, dStartY + rowGap * 4);

  ctx.font = "Bold 40px Arial, sans-serif";
  ctx.fillText(f(data.totalRate), 900, 1800);
  ctx.fillText(f(data.totalAmt), 1350, 1800);
  ctx.fillText(f(data.totalDeductions), 2300, 1800);
  ctx.font = "Bold 45px Arial, sans-serif";
  ctx.fillText(f(data.net), 900, 1860);
  ctx.textAlign = "left";
  ctx.font = "Bold 40px Arial, sans-serif";
  wrapText(ctx, data.netWords, 410, 1915, 1200, 50);

  ctx.textAlign = "center";
  ctx.font = "40px Arial, sans-serif";
  ctx.fillText("HR Manager", 2030, 1950);

  const outputPath = path.join(outputDir, `payslip_${index + 1}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
}

export async function generateSalarySlips(
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

    let salaryData: SalarySlipData[];
    if (isAIConfigured()) {
      console.log("🤖 Generating salary slip data using AI...");
      try {
        salaryData = await generateSalaryDataAI(sample as number);
        console.log("✅ AI generation successful");
      } catch (aiError) {
        console.warn("⚠️ AI generation failed, using fallback", aiError);
        salaryData = generateSalaryDataFallback(sample as number);
      }
    } else {
      console.log("ℹ️ AI not configured, using fallback");
      salaryData = generateSalaryDataFallback(sample as number);
    }

    for (let i = 0; i < sample; i++) {
      await generateSinglePayslip(salaryData[i], i, outputDir);
    }

    const zipFile = await zipImages("salary_slips", outputDir);
    console.log(`🎉 ${sample} salary slips generated -> ${zipFile}`);

    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating salary slips");
  }
}
