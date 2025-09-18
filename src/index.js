// index.js
import express from "express";
import bodyParser from "body-parser";

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

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(express.static("public"));

// Centralized config
const docOptions = [
  { value: "pan_trust", label: "PAN (Trust)", handler: generatePANcards },
  { value: "pan_company", label: "PAN (Company)", handler: generatePANcards },
  { value: "ration_card", label: "Ration Card", handler: generateRationCards },
  { value: "gas_bill", label: "Gas Bill", handler: generateGasBills },
  { value: "eb_bill", label: "Electricity Bill", handler: generateEBBills },
  {
    value: "birth_certificate",
    label: "Birth Certificate",
    handler: generateBirthCertificates,
  },
  {
    value: "employment_letter",
    label: "Employment Offer Letter",
    handler: generateEmploymentLetters,
  },
  { value: "grn", label: "Goods Receipt Note (GRN)", handler: generateGRN },
  {
    value: "purchase_order",
    label: "Purchase Order",
    handler: generatePurchaseOrders,
  },
  {
    value: "vehicle_rc",
    label: "Vehicle Registration Certificate",
    handler: generateVehicleRC,
  },
  { value: "salary_slip", label: "Salary Slip", handler: generateSalarySlips },
  {
    value: "rental_agreement",
    label: "Rental Agreement",
    handler: generateRentalAgreements,
  },
];

// Map for quick lookup
const docHandlers = Object.fromEntries(
  docOptions.map((opt) => [opt.value, opt.handler])
);

// Routes
app.get("/", (_, res) => {
  res.send("🚀 Document Generator API is running!");
});

app.get("/options", (_, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(docOptions.map(({ value, label }) => ({ value, label }))); // hide handler
});

app.post("/generate", async (req, res) => {
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
