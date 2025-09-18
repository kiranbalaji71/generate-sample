// employment_letter.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

// ------------------
// __dirname
// ------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------
// Output Directory
// ------------------
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ------------------
// Helpers
// ------------------
function formatDate(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
function randomDateBetween(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ------------------
// Sample Data
// ------------------
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
  {
    name: "Wipro Enterprises",
    addr: "Sarjapur Road, Bangalore - 560035",
    website: "www.wipro.com",
    auth: "Wipro Ltd",
  },
  {
    name: "HDFC Bank",
    addr: "Churchgate, Mumbai - 400020",
    website: "www.hdfcbank.com",
    auth: "HDFC Bank Ltd",
  },
  {
    name: "Reliance Retail",
    addr: "Nariman Point, Mumbai - 400021",
    website: "www.relianceretail.com",
    auth: "Reliance Retail Ltd",
  },
];
const firstNames = [
  "Arun",
  "Neha",
  "Ravi",
  "Priya",
  "Sneha",
  "Rahul",
  "Deepak",
  "Meera",
  "Shyam",
  "Vijay",
];
const lastNames = [
  "Kumar",
  "Sharma",
  "Verma",
  "Iyer",
  "Naidu",
  "Reddy",
  "Patel",
  "Singh",
];
const jobRoles = [
  "Software Engineer",
  "Business Analyst",
  "HR Executive",
  "Marketing Manager",
  "Finance Associate",
  "Legal Officer",
  "Project Manager",
];
const units = [
  "Bangalore Unit",
  "Chennai Unit",
  "Mumbai Unit",
  "Delhi Unit",
  "Hyderabad Unit",
];
const benefits = [
  "Car, Accommodation, Insurance and other perks",
  "Medical Insurance, Travel Reimbursement, Food Coupons",
  "Work From Home, Internet Reimbursement, Childcare Allowance",
  "Provident Fund, Leave Travel Allowance, Conveyance",
];
const reportTimes = ["08:30 a.m.", "09:00 a.m.", "09:30 a.m.", "10:00 a.m."];
const managers = [
  "Mr. A.B. Trivedi",
  "Ms. Meenakshi",
  "Mr. Raghavan",
  "Mrs. Kavita",
  "Mr. Anil Deshmukh",
];
const signatories = [
  { name: "S.K. Venkatraman", designation: "Deputy General Manager – HR" },
  { name: "R. Krishnan", designation: "Senior HR Manager" },
  { name: "Meera Nair", designation: "Assistant Vice President – HR" },
  { name: "Anil Kapoor", designation: "General Manager – Services" },
];

// ------------------
// Text Wrapper
// ------------------
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lineArray = [];

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

// ------------------
// Generate Single Letter
// ------------------
async function generateSingleLetter(data, index) {
  const baseImage = await loadImage(
    path.join(__dirname, "../templates", "offer-letter-sample-template.png")
  );
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
  ctx.fillStyle = "black";

  // Header
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

  // Candidate
  ctx.fillText(data["Candidate Name"], 215, 605);
  ctx.fillText(data["Candidate Address"], 215, 660);
  ctx.fillText(data["Candidate Contact"], 215, 720);

  // Body
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

  // Signature
  ctx.fillText(data["Authorized Company Name"], 215, 2655);
  ctx.fillText(data["Authorized Signatory Name"], 215, 2825);
  ctx.fillText(data["Authorized Signatory Designation"], 215, 2880);

  // Save
  const filePath = path.join(outputDir, `offer_letter_${index + 1}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
}

// ------------------
// Generate All & Zip
// ------------------
export async function generateEmploymentLetters(payload, res) {
  // clear old
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 50;
    for (let i = 0; i < sample; i++) {
      const company = randomChoice(companies);
      const candidate = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
      const data = {
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
        "Authorized Signatory Designation":
          randomChoice(signatories).designation,
        "Authorized Company Name": company.auth,
      };
      await generateSingleLetter(data, i);
    }

    // Create zip
    const zipFile = await zipImages("employment_letters", outputDir);
    console.log(
      `🎉 ${sample} Employment offer letters generated -> ${zipFile}`
    );

    // Return file
    res.download(zipFile, path.basename(zipFile));
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to generate Employment offer letters" });
  }
}
