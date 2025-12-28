// index.ts
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

import { generatePANcards } from "./generate/pan.js";
import { generateRationCards } from "./generate/rationcard.js";
import { generateGasBills } from "./generate/gasbill.js";
import { generateEBBills } from "./generate/ebbills.js";
import { generateBirthCertificates } from "./generate/birthcertification.js";
import { generateEmploymentLetters } from "./generate/employmentletter.js";
import { generateGRN } from "./generate/grn.js";
import { generatePurchaseOrders } from "./generate/purchaseorder.js";
import { generateVehicleRC } from "./generate/vehiclerc.js";
import { generateSalarySlips } from "./generate/salaryslip.js";
import { generateRentalAgreements } from "./generate/rentalagreement.js";
import { DocumentOption, DocumentHandler } from "./types/index.js";

const app = express();
const PORT = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static("public"));

// Centralized config
const docOptions: DocumentOption[] = [
  {
    value: "pan_trust",
    label: "PAN (Trust)",
    handler: generatePANcards as DocumentHandler,
  },
  {
    value: "pan_company",
    label: "PAN (Company)",
    handler: generatePANcards as DocumentHandler,
  },
  {
    value: "ration_card",
    label: "Ration Card",
    handler: generateRationCards as DocumentHandler,
  },
  {
    value: "gas_bill",
    label: "Gas Bill",
    handler: generateGasBills as DocumentHandler,
  },
  {
    value: "eb_bill",
    label: "Electricity Bill",
    handler: generateEBBills as DocumentHandler,
  },
  {
    value: "birth_certificate",
    label: "Birth Certificate",
    handler: generateBirthCertificates as DocumentHandler,
  },
  {
    value: "employment_letter",
    label: "Employment Offer Letter",
    handler: generateEmploymentLetters as DocumentHandler,
  },
  {
    value: "grn",
    label: "Goods Receipt Note (GRN)",
    handler: generateGRN as DocumentHandler,
  },
  {
    value: "purchase_order",
    label: "Purchase Order",
    handler: generatePurchaseOrders as DocumentHandler,
  },
  {
    value: "vehicle_rc",
    label: "Vehicle Registration Certificate",
    handler: generateVehicleRC as DocumentHandler,
  },
  {
    value: "salary_slip",
    label: "Salary Slip",
    handler: generateSalarySlips as DocumentHandler,
  },
  {
    value: "rental_agreement",
    label: "Rental Agreement",
    handler: generateRentalAgreements as DocumentHandler,
  },
];

// Map for quick lookup
const docHandlers: Record<string, DocumentHandler> = Object.fromEntries(
  docOptions.map((opt) => [opt.value, opt.handler])
);

// Routes
app.get("/", (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/options", (_: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(docOptions.map(({ value, label }) => ({ value, label }))); // hide handler
});

app.post("/generate", async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    const handler = docHandlers[type];

    if (!handler) {
      return res
        .status(400)
        .json({ error: "Invalid or missing 'type' field." });
    }

    await handler(req.body, res);
  } catch (error) {
    console.error("❌ Error generating document:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
