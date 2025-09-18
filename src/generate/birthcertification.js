// src/generate/birth.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

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
function randomUID() {
  return Math.floor(100000000000 + Math.random() * 900000000000);
}
function randomDateBetween(start, end) {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
}
function generateCertificateNo(cityCode, issueDate, seq) {
  const [day, monStr, year] = issueDate.split("-");
  const month = new Date(`${monStr} 1, ${year}`).getMonth() + 1;
  const monthStr = String(month).padStart(2, "0");
  const seqStr = String(seq).padStart(7, "0");
  return `${cityCode}/${monthStr}/${year}/${seqStr}`;
}
function generateRegistrationNo(bodyCode, year, ward, serial) {
  const serialStr = String(serial).padStart(5, "0");
  return `${bodyCode}/${year}/${ward}/${serialStr}`;
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

// ---------------- SAMPLE DATA ----------------
const maleNames = [
  "Arun Kumar",
  "Suresh Babu",
  "Prakash Raj",
  "Vignesh",
  "Karthik",
  "Ramesh",
];
const femaleNames = ["Meena", "Divya", "Lakshmi", "Ananya", "Harini", "Priya"];
const fatherNames = [
  "Ramesh Kumar",
  "Sundar Raj",
  "Mohan Babu",
  "Krishnan Iyer",
];
const motherNames = ["Saranya", "Kavitha", "Geetha", "Lakshmi"];

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
const cityConfigs = {
  Chennai: { certCode: "CHN", bodyCode: 101, wards: [11, 12, 13] },
  Madurai: { certCode: "MDU", bodyCode: 102, wards: [21, 22, 23] },
};

// ---------------- GENERATOR ----------------
function generateBirthData(n = 100) {
  const rows = [];
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

    // Dates
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

    const dob = dobDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
    const regDateStr = regDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
    const issueDateStr = issueDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    const config = cityConfigs[city];
    const year = dob.split("-")[2];
    const ward = config.wards[Math.floor(Math.random() * config.wards.length)];
    const serial = 2000 + i;

    const regNo = generateRegistrationNo(config.bodyCode, year, ward, serial);
    const certNo = generateCertificateNo(config.certCode, issueDateStr, i + 1);

    const address = (j) =>
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
      "Permanent Address of Parents": address(i),
      "Address at Time of Birth": address(i + 1),
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
async function drawCertificate(data, index, baseImage, signatureImage) {
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(baseImage, 0, 0);

  ctx.font = "42px Arial, sans-serif";
  ctx.fillStyle = "black";

  ctx.fillText(data["Name of Child"], 1270, 1290);
  ctx.fillText(data["Sex"], 1270, 1385);
  ctx.fillText(data["Date of Birth"], 1270, 1498);
  wrapText(ctx, data["Place of Birth"], 1270, 1595, 1000, 50);

  ctx.fillText(data["Name of Father"], 1270, 1850);
  ctx.fillText(data["UID of Father"], 1270, 1955);
  ctx.fillText(data["Name of Mother"], 1270, 2048);
  ctx.fillText(data["UID of Mother"], 1270, 2145);

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
export async function generateBirthCertificates(payload, res) {
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((f) =>
      fs.unlinkSync(path.join(outputDir, f))
    );
  }
  try {
    const sample = parseInt(payload.sample) || 50;
    const data = generateBirthData(sample);
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
