export type CCCStatus =
  | "AVAILABLE"
  | "IN_TRANSFER"
  | "RETIRED"
  | "FROZEN"
  | "LOCKED"
  | "PENDING";

export interface ProvenanceStep {
  step: string;
  actor: string;
  timestamp: string;
  hash: string;
  detail: string;
  status: string;
}

export interface CCC {
  id: string;
  origin: string;
  plant: string;
  reportingPeriod: string;
  quantity: number;
  verificationId: string;
  verifierBody: string;
  currentOwner: string;
  status: CCCStatus;
  issuedDate: string;
  lastTx: string;
  blockHash: string;
  blockNumber: number;
  mrvId?: string;
  provenance: ProvenanceStep[];
}

export interface MRVRecord {
  id: string;
  plant: string;
  location: string;
  period: string;
  emissions: string;
  intensity: string;
  quality: string;
  status: string;
  targetRatio: number;
  category: string;
}

export interface OrderBookRow {
  price: number;
  quantity: number;
  total: number;
  depth: string;
}

export interface OrderBook {
  sells: OrderBookRow[];
  buys: OrderBookRow[];
  currentPrice: number;
  change24h: string;
  volume24h: string;
  activeOrders: string;
}

export interface Anomaly {
  id: string;
  priority: string;
  plant: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
  mrvId: string;
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  tx: string;
  status: string;
}

export interface SearchResult {
  type: "CARBON CREDIT" | "MRV RECORD" | "TRANSACTION" | "VERIFICATION RECORD";
  title: string;
  subtitle: string;
  item?: CCC | MRVRecord;
  targetView: string;
}

export type ViewId =
  | "dashboard"
  | "mrv"
  | "anomalies"
  | "verification"
  | "registry"
  | "issuance"
  | "retirement"
  | "marketplace"
  | "audit";
