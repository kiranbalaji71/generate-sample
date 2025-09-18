// generate_vehicle_rc.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { zipImages } from "../helper/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure output folder exists
const outputDir = path.join(__dirname, "../../output", "samples");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ------------------ Sample Data ------------------
const vehicleMapping = {
  "Motor Car(LMV)": {
    models: ["WAGON R LXI", "SWIFT VDI", "i20 Sportz", "Innova Crysta"],
    fuels: ["PETROL", "DIESEL", "EV"],
  },
  Motorcycle: {
    models: ["Pulsar 150", "Royal Enfield Classic", "Splendor Plus"],
    fuels: ["PETROL"],
  },
  Scooter: {
    models: ["Activa 6G", "Jupiter", "Ola S1"],
    fuels: ["PETROL", "EV"],
  },
  "Auto Rickshaw": {
    models: ["Bajaj RE", "Piaggio Ape"],
    fuels: ["PETROL", "CNG", "EV"],
  },
  Truck: { models: ["Tata 407", "Ashok Leyland Dost"], fuels: ["DIESEL"] },
  Bus: { models: ["Volvo 9400", "Tata Marcopolo"], fuels: ["DIESEL", "EV"] },
};

const issuingAuthorities = [
  "Faridabad, Haryana",
  "Mumbai, Maharashtra",
  "Chennai, Tamil Nadu",
  "Bangalore, Karnataka",
  "Hyderabad, Telangana",
  "Delhi, NCR",
  "Pune, Maharashtra",
  "Kolkata, West Bengal",
];

const stateCodeMap = {
  "Faridabad, Haryana": "HR",
  "Mumbai, Maharashtra": "MH",
  "Chennai, Tamil Nadu": "TN",
  "Bangalore, Karnataka": "KA",
  "Hyderabad, Telangana": "TS",
  "Delhi, NCR": "DL",
  "Pune, Maharashtra": "MH",
  "Kolkata, West Bengal": "WB",
};

const colors = ["WHITE", "BLACK", "RED", "BLUE", "SILVER", "GREY"];
const firstNames = [
  "Amit",
  "Anita",
  "Ramesh",
  "Sunil",
  "Priya",
  "Rajesh",
  "Neha",
  "Vikram",
  "Pooja",
  "Rohan",
];
const lastNames = [
  "Kumar",
  "Sharma",
  "Patel",
  "Rao",
  "Singh",
  "Gupta",
  "Mehta",
  "Joshi",
  "Verma",
  "Kapoor",
];
const financers = [
  "HDFC BANK LTD",
  "ICICI BANK",
  "SBI FINANCE",
  "BAJAJ FINSERV",
  "",
];
const insuranceCompanies = [
  "UNITED INDIA INSURANCE CO.LTD",
  "ICICI LOMBARD",
  "HDFC ERGO",
  "BAJAJ ALLIANZ",
  "ORIENTAL INSURANCE",
];

// ------------------ Helper Functions ------------------
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (start, end) => {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};

const randomChassisNo = () =>
  "MA" + Math.random().toString(36).substring(2, 10).toUpperCase();
const randomEngineNo = () =>
  "EN" + (100000 + Math.floor(Math.random() * 900000));
const randomCapacity = () =>
  (800 + Math.floor(Math.random() * 2000)).toFixed(2);
const randomOwnerName = () =>
  `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
const randomAddress = () =>
  `NO ${Math.floor(Math.random() * 500)}, ${randomChoice(["MG Road", "Brigade Road", "Connaught Place", "Anna Salai", "Banjara Hills", "Salt Lake"])}, India-${100000 + Math.floor(Math.random() * 899999)}`;
const randomPolicyNo = () =>
  String(1000000000000000 + Math.floor(Math.random() * 9000000000000000));

function randomDateTime() {
  const d = new Date(
    2020 + Math.floor(Math.random() * 5),
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1,
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60)
  );
  return (
    d
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/ /g, "-") + " IST"
  );
}

// Generate Registration No
function generateRegistrationNo(issuingAuthority) {
  const state = stateCodeMap[issuingAuthority] || "XX";
  const rto = String(Math.floor(1 + Math.random() * 99)).padStart(2, "0");
  const series =
    Math.random() > 0.5
      ? String.fromCharCode(65 + Math.floor(Math.random() * 26))
      : String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
        String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = String(1000 + Math.floor(Math.random() * 9000));
  return `${state}${rto}${series}${number}`;
}

// ------------------ Generate RC Data ------------------
function generateRcData(n = 200) {
  const data = [];
  for (let i = 0; i < n; i++) {
    const issuingAuthority = randomChoice(issuingAuthorities);
    const vehicleClass = randomChoice(Object.keys(vehicleMapping));
    const model = randomChoice(vehicleMapping[vehicleClass].models);
    const fuel = randomChoice(vehicleMapping[vehicleClass].fuels);

    data.push({
      "Issuing Authority": issuingAuthority,
      "Registration Number": generateRegistrationNo(issuingAuthority),
      "Registration Date": randomDate(
        new Date(2018, 0, 1),
        new Date(2024, 11, 31)
      ),
      "Vehicle Class": vehicleClass,
      "Vehicle Model": model,
      "Fuel Type": fuel,
      "Vehicle Color": randomChoice(colors),
      "Chassis Number": randomChassisNo(),
      "Engine Number": randomEngineNo(),
      "Month/Year of Mfg": `${Math.floor(1 + Math.random() * 12)}/${2015 + Math.floor(Math.random() * 10)}`,
      "Cubic Capacity": randomCapacity(),
      "Owner Name": randomOwnerName(),
      "S/W/D Name": randomOwnerName(),
      "Present Address": randomAddress(),
      "Permanent Address": randomAddress(),
      "Name of Financer": randomChoice(financers),
      "RC Status": "ACTIVE",
      "RC Blacklist Status": Math.random() > 0.9 ? "YES" : "",
      "Tax Up To": randomDate(new Date(2025, 0, 1), new Date(2035, 11, 31)),
      "Owner Sno": (1 + Math.floor(Math.random() * 3)).toString(),
      "Insurance Company": randomChoice(insuranceCompanies),
      "Policy Number": randomPolicyNo(),
      "Insurance Valid Upto": randomDate(
        new Date(2024, 0, 1),
        new Date(2030, 11, 31)
      ),
      "PUC Certificate Number":
        "PUC" + (1000 + Math.floor(Math.random() * 9000)),
      "PUC Valid Upto": randomDate(
        new Date(2024, 0, 1),
        new Date(2028, 11, 31)
      ),
      "Fitness Certificate Valid Upto": randomDate(
        new Date(2024, 0, 1),
        new Date(2035, 11, 31)
      ),
      "Digital Signature Date": randomDateTime(),
    });
  }
  return data;
}

// ------------------ Image Renderer ------------------
async function generateSingleRC(data, index) {
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

// ------------------ Express Route ------------------
export async function generateVehicleRC(payload, res) {
  try {
    const sample = parseInt(payload.sample) || 50;
    const records = generateRcData(sample);

    const imagePaths = [];
    for (let i = 0; i < records.length; i++) {
      const img = await generateSingleRC(records[i], i);
      imagePaths.push(img);
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
