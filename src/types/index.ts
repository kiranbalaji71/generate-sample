import { Response } from "express";

export interface DocumentOption {
  value: string;
  label: string;
  handler: DocumentHandler;
}

export interface GeneratorPayload {
  type: string;
  sample?: number | string;
  [key: string]: any;
}

export type DocumentHandler = (
  payload: GeneratorPayload,
  res: Response
) => Promise<void> | void;

export interface PANData {
  name: string;
  date: string;
  pan_no: string;
}

export interface RationCardData {
  ration_card_no: string;
  name: string;
  father_husband: string;
  head_of_family: string;
  dob: string;
  dealer_name: string;
  dealer_address: string;
  address: string;
  ward: string;
  village_municipality: string;
  rural: string;
  block: string;
  district: string;
  state: string;
  pin_code: number;
  date: string;
  sub_area: string;
}

export interface GasBillData {
  consumer_no: string;
  distributor_serial_no: string;
  name: string;
  address: string;
  order_no: string;
  order_date: string;
  connection_type: string;
  subsibidy_consumed: string;
  kg_cyl_rs: string;
  price: string;
  cgst: string;
  sgst: string;
  final_price: string;
  tax_invoice_no: string;
  tax_invoice_date: string;
  order_status: string;
  order_type: string;
  issue_dl: string;
}

export interface EBBillData {
  service_no: string;
  name: string;
  bill_amount: string;
  bill_month_year: string;
  receipt_no: string;
  receipt_date: string;
  amount_debited: string;
  bank_transaction_no: number;
  bank_authorisation_id: string;
  card_type: string;
}

export interface BirthCertificateData {
  "Certificate No": string;
  "Name of Child": string;
  Sex: string;
  "Date of Birth": string;
  "Place of Birth": string;
  "Name of Father": string;
  "UID of Father": number;
  "Name of Mother": string;
  "UID of Mother": number;
  "Permanent Address of Parents": string;
  "Address at Time of Birth": string;
  "Registration Number": string;
  "Date of Registration": string;
  Remarks: string;
  "Date of Issue": string;
  "Issuing Authority": string;
}

export interface EmploymentLetterData {
  "Company Name": string;
  "Company Address": string;
  "Company Website": string;
  "Date of Issue": string;
  "Candidate Name": string;
  "Candidate Address": string;
  "Candidate Contact": string;
  "Position Offered": string;
  "Unit Name": string;
  "Employment Type": string;
  CTC: string;
  "Other Benefits": string;
  "Reporting Date": string;
  "Reporting Time": string;
  "Reporting Manager": string;
  "Authorized Signatory Name": string;
  "Authorized Signatory Designation": string;
  "Authorized Company Name": string;
}

export interface GRNData {
  company_name: string;
  company_website: string;
  grn_no: string;
  date: string;
  supplier_name: string;
  supplier_address: string;
  supplier_city: string;
  supplier_pincode: string;
  po_no: string;
  carrier_name: string;
  delivery_address: string;
  delivery_city: string;
  delivery_pincode: string;
  delivery_date: string;
  items: Array<{
    no: number;
    description: string;
    ordered: number;
    received: number;
    amount: number;
  }>;
  total_amount: number;
  payment_method: string;
}

export interface PurchaseOrderData {
  po_number: string;
  po_date: string;
  issue_date: string;
  buyer: {
    name: string;
    street: string;
    city: string;
    country: string;
    pincode: string;
  };
  supplier: {
    name: string;
    street: string;
    city: string;
    country: string;
    pincode: string;
  };
  items: Array<{
    no: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  gst: number;
  total_amount: number;
  buyer_delivery_address: {
    street: string;
    city: string;
    country: string;
    pincode: string;
  };
  buyer_delivery_date: string;
  buyer_payment_terms: string;
}

export interface VehicleRCData {
  "Issuing Authority": string;
  "Registration Number": string;
  "Registration Date": string;
  "Vehicle Class": string;
  "Vehicle Model": string;
  "Fuel Type": string;
  "Vehicle Color": string;
  "Chassis Number": string;
  "Engine Number": string;
  "Month/Year of Mfg": string;
  "Cubic Capacity": string;
  "Owner Name": string;
  "S/W/D Name": string;
  "Present Address": string;
  "Permanent Address": string;
  "Name of Financer": string;
  "RC Status": string;
  "RC Blacklist Status": string;
  "Tax Up To": string;
  "Owner Sno": string;
  "Insurance Company": string;
  "Policy Number": string;
  "Insurance Valid Upto": string;
  "PUC Certificate Number": string;
  "PUC Valid Upto": string;
  "Fitness Certificate Valid Upto": string;
  "Digital Signature Date": string;
}

export interface SalarySlipData {
  company: {
    name: string;
    city: string;
    addr: string;
    pfCode: string;
  };
  empId: string;
  empName: string;
  pfNo: string;
  uan: string;
  esiNo: string;
  present: number;
  absent: number;
  doj: string;
  department: string;
  branch: string;
  earnings: {
    basicAmt: number;
    daAmt: number;
    hraAmt: number;
    specialAmt: number;
    medicalAmt: number;
    transportAmt: number;
    eduAmt: number;
  };
  earningsRate: {
    basic: number;
    da: number;
    hra: number;
    special: number;
    medical: number;
    transport: number;
    edu: number;
  };
  deductions: {
    pf: number;
    esi: number;
    pt: number;
    tds: number;
    adv: number;
  };
  totalRate: number;
  totalAmt: number;
  totalDeductions: number;
  net: number;
  netWords: string;
  month: string;
  year: number;
  companyName: string;
  companyAddr: string;
}

export interface RentalAgreementData {
  date: string;
  landlord_title: string;
  landlord_name: string;
  landlord_address: string;
  tenant_title: string;
  tenant_name: string;
  tenant_address: string;
  address: string;
  rent: number;
  rent_words: string;
  deposit: number;
  witness1_name: string;
  witness2_name: string;
}
