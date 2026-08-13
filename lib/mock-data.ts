import { CCC, MRVRecord, OrderBook, Anomaly, AuditLogEntry } from "./types";

// NOTE: All data in this file is DEMO / SIMULATED for prototype purposes.
// This is not official CCTS/BEE registry data.

export const INITIAL_CCC_DATABASE: CCC[] = [
  {
    id: "CCC-IN-2026-00018473",
    origin: "ABC Cement Infrastructure Ltd.",
    plant: "Maharashtra Plant 04 (Chandrapur)",
    reportingPeriod: "Q2 2026 (Apr - Jun)",
    quantity: 1,
    verificationId: "VER-ACVA002-2026-00918",
    verifierBody: "Bureau Veritas India",
    currentOwner: "ABC Cement Infrastructure Ltd.",
    status: "AVAILABLE",
    issuedDate: "2026-07-12 14:32 IST",
    lastTx: "TX-994201-9281 (Issuance)",
    blockHash: "0x8f2a41d9c103e482b901a8d11c4e902b740112fa89b21041ca9",
    blockNumber: 18492014,
    mrvId: "MRV-95352733385",
    provenance: [
      { step: "Emission Data", actor: "CEMS Sensors & IoT Gateway", timestamp: "2026-06-30 23:59 IST", hash: "0x11a0...9481", detail: "82,431 tCO2e measured across 4 stacks with 99.8% sensor uptime.", status: "VERIFIED" },
      { step: "MRV Calculation", actor: "CarbonChain Automated MRV Engine", timestamp: "2026-07-02 08:15 IST", hash: "0x33b1...8812", detail: "Specific emission intensity verified at 0.824 tCO2e/t clinker against baseline 0.890.", status: "VERIFIED" },
      { step: "Verification", actor: "Bureau Veritas (Independent Verifier)", timestamp: "2026-07-08 16:45 IST", hash: "0x55c2...7723", detail: "On-site and digital evidence audit completed. Zero material misstatements.", status: "VERIFIED" },
      { step: "CCC Issuance", actor: "CCTS Registry Administrator (BEE)", timestamp: "2026-07-12 14:32 IST", hash: "0x8f2a...1041", detail: "Minted batch serial CCC-IN-2026-00018000 to CCC-IN-2026-00028427.", status: "ISSUED" },
      { step: "ABC Cement", actor: "ABC Cement Infrastructure Ltd.", timestamp: "2026-07-12 14:32 IST", hash: "0x99d4...3341", detail: "Primary allocation deposited into custodian wallet.", status: "CURRENT_OWNER" },
    ],
  },
  {
    id: "CCC-IN-2026-00018474",
    origin: "XYZ Aluminium Steels Corp",
    plant: "Odisha Smelter Unit 02 (Jharsuguda)",
    reportingPeriod: "Q2 2026 (Apr - Jun)",
    quantity: 100,
    verificationId: "VER-TUV001-2026-00412",
    verifierBody: "SGS India Compliance",
    currentOwner: "GreenFuture Capital Funds",
    status: "IN_TRANSFER",
    issuedDate: "2026-07-15 10:14 IST",
    lastTx: "TX-104928-8812 (Marketplace Settlement)",
    blockHash: "0x43e9102c8410d992a18820c4118a108aef102194821a",
    blockNumber: 18495110,
    mrvId: "MRV-95352732389",
    provenance: [
      { step: "Emission Data", actor: "IoT Power Meters & ERP System", timestamp: "2026-06-30 23:59 IST", hash: "0x77f1...1092", detail: "61,208 tCO2e logged.", status: "VERIFIED" },
      { step: "MRV Calculation", actor: "CarbonChain MRV Engine", timestamp: "2026-07-03 11:20 IST", hash: "0x88f2...2103", detail: "Intensity calculated: 0.912 tCO2e/t.", status: "VERIFIED" },
      { step: "Verification", actor: "SGS India Compliance", timestamp: "2026-07-10 14:00 IST", hash: "0x99f3...3214", detail: "Audit certificate issued.", status: "VERIFIED" },
      { step: "CCC Issuance", actor: "CCTS Registry Admin", timestamp: "2026-07-15 10:14 IST", hash: "0x11f4...4325", detail: "Serial batch minted.", status: "ISSUED" },
      { step: "Trade Settlement", actor: "GreenFuture Capital Funds", timestamp: "2026-08-01 11:05 IST", hash: "0x22f5...5436", detail: "Acquired via Order #ORD-2026-9918 at ₹1,280/CCC.", status: "IN_TRANSFER" },
    ],
  },
  {
    id: "CCC-IN-2025-00009182",
    origin: "Karnataka Solar Grid Corp",
    plant: "Pavagada Solar Park Block 3",
    reportingPeriod: "Q4 2025 (Jan - Mar)",
    quantity: 50,
    verificationId: "VER-DNV003-2025-08172",
    verifierBody: "DNV GL India",
    currentOwner: "Reliance Clean Energy Obligations",
    status: "RETIRED",
    issuedDate: "2025-04-10 09:00 IST",
    lastTx: "TX-778102-1192 (Surrender Certificate #SUR-9901)",
    blockHash: "0x10a2981048f102e3b4a8c91d81e102f901a884",
    blockNumber: 17291048,
    mrvId: "MRV-88291048210",
    provenance: [
      { step: "Emission Data", actor: "SCADA Grid Inverters", timestamp: "2025-03-31 23:59 IST", hash: "0xaa11...1111", detail: "45,000 MWh renewable generation verified.", status: "VERIFIED" },
      { step: "CCC Issuance", actor: "CCTS Registry Admin", timestamp: "2025-04-10 09:00 IST", hash: "0xbb22...2222", detail: "Issued to Karnataka Solar Grid.", status: "ISSUED" },
      { step: "Market Trade", actor: "Reliance Clean Energy", timestamp: "2025-05-18 15:30 IST", hash: "0xcc33...3333", detail: "Traded on CCTS Market platform.", status: "TRANSFERRED" },
      { step: "Retirement / Surrender", actor: "Bureau of Energy Efficiency (BEE)", timestamp: "2026-03-31 18:00 IST", hash: "0xdd44...4444", detail: "Surrendered against mandatory CCTS FY25 compliance obligation.", status: "PERMANENTLY_RETIRED" },
    ],
  },
  {
    id: "CCC-IN-2026-00021004",
    origin: "Gujarat Chlor-Alkali Tech",
    plant: "Dahej Chemical Complex",
    reportingPeriod: "Q2 2026 (Apr - Jun)",
    quantity: 14,
    verificationId: "VER-PENDING-991",
    verifierBody: "TUV SUD South Asia",
    currentOwner: "Gujarat Chlor-Alkali Tech",
    status: "FROZEN",
    issuedDate: "2026-07-20 16:10 IST",
    lastTx: "TX-990012-FREEZE (Registry Safety Interlock)",
    blockHash: "0x99201a884f102e88a10294811a004b",
    blockNumber: 18501029,
    mrvId: "MRV-95352788102",
    provenance: [
      { step: "Emission Data", actor: "Steam Flow Meter #FM-04", timestamp: "2026-06-30 23:59 IST", hash: "0xee11...0011", detail: "Discrepancy detected in steam enthalpy readings.", status: "FLAGGED" },
      { step: "Registry Safety Interlock", actor: "CarbonChain Automated Fraud Engine", timestamp: "2026-07-21 02:14 IST", hash: "0xff22...0022", detail: "Temporary freeze applied due to 31% steam spike with 4% production shift.", status: "FROZEN" },
    ],
  },
];

export const INITIAL_MRV_RECORDS: MRVRecord[] = [
  { id: "MRV-95352733385", plant: "ABC Cement", location: "Chandrapur, MH", period: "Q2 2026", emissions: "82,431 tCO₂e", intensity: "0.824 tCO₂e/t", quality: "99.8%", status: "Verified", targetRatio: 0.92, category: "Cement" },
  { id: "MRV-95352732389", plant: "XYZ Aluminium", location: "Jharsuguda, OR", period: "Q2 2026", emissions: "61,208 tCO₂e", intensity: "0.912 tCO₂e/t", quality: "96.2%", status: "Needs Review", targetRatio: 0.81, category: "Aluminium" },
  { id: "MRV-95352744012", plant: "Tata Steel Kalinganagar", location: "Kalinganagar, OR", period: "Q2 2026", emissions: "142,900 tCO₂e", intensity: "1.740 tCO₂e/t", quality: "99.9%", status: "Verified", targetRatio: 0.96, category: "Steel" },
  { id: "MRV-95352755190", plant: "NTPC Ramagundam Unit 3", location: "Ramagundam, TS", period: "Q2 2026", emissions: "210,450 tCO₂e", intensity: "0.885 tCO₂e/MWh", quality: "98.4%", status: "Processing", targetRatio: 0.88, category: "Thermal Power" },
  { id: "MRV-95352766821", plant: "Jindal Power Raigarh", location: "Raigarh, CG", period: "Q2 2026", emissions: "98,120 tCO₂e", intensity: "0.910 tCO₂e/MWh", quality: "94.5%", status: "Needs Review", targetRatio: 0.79, category: "Thermal Power" },
];

export const INITIAL_ORDER_BOOK: OrderBook = {
  sells: [
    { price: 1310, quantity: 420, total: 550200, depth: "85%" },
    { price: 1304, quantity: 280, total: 365120, depth: "60%" },
    { price: 1298, quantity: 510, total: 661980, depth: "95%" },
  ],
  buys: [
    { price: 1279, quantity: 350, total: 447650, depth: "70%" },
    { price: 1273, quantity: 720, total: 916560, depth: "100%" },
    { price: 1268, quantity: 410, total: 519880, depth: "80%" },
  ],
  currentPrice: 1284,
  change24h: "+3.7%",
  volume24h: "18,421 CCC",
  activeOrders: "2,481",
};

export const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: "ANM-2026-0812",
    priority: "HIGH PRIORITY",
    plant: "Gujarat Chlor-Alkali Tech (Dahej)",
    title: "Electricity consumption vs production divergence",
    description: "Electricity consumption increased 31% while production increased only 4% during May 14 - May 28 window.",
    timestamp: "2026-08-11 04:12 IST",
    status: "UNDER REVIEW",
    mrvId: "MRV-95352788102",
  },
  {
    id: "ANM-2026-0809",
    priority: "MEDIUM PRIORITY",
    plant: "XYZ Aluminium (Jharsuguda)",
    title: "Telemetry gap in IoT Energy Meter #03",
    description: "2-hour packet loss registered on main grid line B telemetry feed. Gap filled using verified utility invoice backup.",
    timestamp: "2026-08-09 18:30 IST",
    status: "RESOLVED",
    mrvId: "MRV-95352732389",
  },
];

export const MOCK_AUDIT_TRAIL: AuditLogEntry[] = [
  { timestamp: "12 Aug 2026, 18:42:10", actor: "Bureau Veritas (Verifier)", action: "APPROVE_MRV", resource: "MRV-95352733385", tx: "TX-009821-BC", status: "Verified" },
  { timestamp: "12 Aug 2026, 17:15:02", actor: "System Interlock", action: "FLAG_ANOMALY", resource: "ANM-2026-0812", tx: "TX-009819-SEC", status: "Flagged" },
  { timestamp: "12 Aug 2026, 14:02:44", actor: "ABC Cement (Issuer)", action: "INITIATE_ISSUANCE", resource: "ISS-2026-00412", tx: "TX-009804-ISS", status: "Pending Registry" },
  { timestamp: "12 Aug 2026, 11:30:19", actor: "GreenFuture Capital", action: "EXECUTE_MARKET_TRADE", resource: "ORD-2026-9918", tx: "TX-009788-MKT", status: "Settled" },
  { timestamp: "11 Aug 2026, 22:11:05", actor: "BEE Registry Node #01", action: "SYNC_MERKLE_TREE", resource: "BLOCK-18495110", tx: "TX-009701-SYNC", status: "Synchronized" },
];
