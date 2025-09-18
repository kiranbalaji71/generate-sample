# Document Generator

A web-based document generator built with **Node.js** and **Express**, featuring multiple document types like PAN cards, Ration Cards, Gas Bills, Birth Certificates, Employment Letters, and more. Users can select the type of document, specify the number of samples, and download them as a ZIP file.

---

## Features

- Generate multiple document types:
  - PAN (Trust / Company)
  - Ration Card
  - Gas Bill
  - Electricity Bill
  - Birth Certificate
  - Employment Offer Letter
  - Goods Receipt Note (GRN)
  - Purchase Order
  - Vehicle Registration Certificate
  - Salary Slip
  - Rental Agreement
- Specify the number of samples to generate.
- Progress bar indicates generation status.
- Download generated documents as a ZIP file.

---

## Installation

1. **Clone the repository**:

```bash
git clone https://github.com/kiranbalaji71/generate-sample.git
cd generate-sample
```

2. **Install dependencies**:

```bash
yarn
```

3. **Run the server**:

```bash
yarn run dev
```

The server will start at [http://localhost:8000](http://localhost:8000).

---

## Project Structure

```
.
├── index.js                  # Main server file
├── public/                   # Frontend files (HTML, CSS, JS)
│   └── index.html
├── generate/                 # Document generation scripts
│   ├── pan.js
│   ├── rationcard.js
│   ├── gasbill.js
│   ├── ebbills.js
│   ├── birthcertification.js
│   ├── employmentletter.js
│   ├── grn.js
│   ├── purchaseorder.js
│   ├── vehiclerc.js
│   ├── salaryslip.js
│   └── rentalagreement.js
└── README.md
```

---

## API Endpoints

### GET `/options`

Returns the list of available document types.

**Response:**

```json
[
  { "value": "pan_trust", "label": "PAN (Trust)" },
  { "value": "pan_company", "label": "PAN (Company)" },
  { "value": "ration_card", "label": "Ration Card" },
  ...
]
```

### POST `/generate`

Generates documents based on the selected type and sample count.

**Request Body:**

```json
{
  "type": "pan_trust",
  "sample": 5
}
```

**Response:**
A ZIP file containing the generated documents.

---

## Frontend

- **HTML:** Simple form to select document type and count.
- **Bootstrap 5:** For styling and responsive layout.
- **Progress bar:** Indicates generation progress.
- **Download:** Automatically triggers ZIP download after generation.

---

## Usage

1. Open your browser and navigate to `http://localhost:8000`.
2. Select the document type from the dropdown.
3. Enter the number of samples.
4. Click **Generate**.
5. Wait for the progress bar to complete and download the ZIP file.

---
