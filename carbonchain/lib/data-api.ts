import { api } from "./api-client";

// ---------- Types matching backend response shapes ----------
export interface Plant {
  id: string;
  organization_id: string;
  name: string;
  sector: string;
  location: string;
  state: string;
  baseline_intensity: number | null;
  baseline_unit: string | null;
}

export interface MrvReport {
  id: string;
  mrv_number: string;
  plant_id: string;
  organization_id: string;
  reporting_period_label: string;
  status: string;
  data_quality_pct: number | null;
  plants?: { name: string; location: string; sector: string };
  mrv_calculations?: { total_emissions_tco2e: number; emission_intensity: number | null; intensity_unit: string | null };
}

export interface Anomaly {
  id: string;
  anomaly_number: string;
  plant_id: string;
  mrv_report_id: string | null;
  rule_code: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  status: "DETECTED" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
  detected_at: string;
  plants?: { name: string };
}

export interface Verification {
  id: string;
  verification_number: string;
  mrv_report_id: string;
  verifier_agency_id: string;
  status: string;
  claimed_reduction_tco2e: number | null;
  verified_emission_rate: number | null;
  baseline_emission_rate: number | null;
  mrv_reports?: { mrv_number: string; plant_id: string; organization_id: string; plants?: { name: string } };
}

export interface VerificationFinding {
  id: string;
  verification_id: string;
  check_key: string;
  check_label: string;
  is_satisfied: boolean;
  notes: string | null;
}

export interface IssuanceRequest {
  id: string;
  issuance_number: string;
  verification_id: string;
  organization_id: string;
  eligible_quantity_tco2e: number;
  status: string;
}

export interface CarbonCredit {
  ccc_id: string;
  organization_id: string;
  plant_id: string;
  reporting_period_label: string;
  quantity_tco2e: number;
  current_owner_organization_id: string;
  status: string;
  issued_at: string;
  plants?: { name: string; location: string };
}

export interface CccEvent {
  id: string;
  ccc_id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  organization_id: string;
  side: "BUY" | "SELL";
  quantity: number;
  quantity_filled: number;
  price_per_ccc: number;
  status: string;
}

export interface OrderBook {
  sells: { price: number; quantity: number }[];
  buys: { price: number; quantity: number }[];
  currentPrice: number | null;
  activeOrders: number;
}

export interface AuditLogEntry {
  id: string;
  actor_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
}

export interface RegistrationRequest {
  id: string;
  auth_user_id: string;
  email: string;
  company_name: string;
  facility_type: string | null;
  address_line: string;
  city: string;
  state: string;
  requested_role: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

export interface Retirement {
  id: string;
  retirement_number: string;
  ccc_id: string;
  reason: string;
  retired_at: string;
}

// ---------- API functions ----------
export const dataApi = {
  plants: {
    list: () => api.get<{ plants: Plant[] }>("/api/plants"),
    create: (body: { name: string; sector: string; location: string; state: string }) =>
      api.post<{ plant: Plant }>("/api/plants", body),
    dataSources: (plantId: string) => api.get<{ dataSources: unknown[] }>(`/api/plants/${plantId}/data-sources`),
  },
  mrv: {
    list: () => api.get<{ mrvReports: MrvReport[] }>("/api/mrv"),
    upload: (body: { plantId: string; csvText: string; dataSourceId?: string }) =>
      api.post<{ batchId: string; summary: { totalRows: number; validRows: number; warningRows: number; rejectedRows: number } }>(
        "/api/mrv/upload",
        body
      ),
    calculate: (body: {
      plantId: string;
      batchId: string;
      reportingPeriodStart: string;
      reportingPeriodEnd: string;
      reportingPeriodLabel: string;
      productionQuantity?: number;
      productionUnit?: string;
    }) => api.post<{ mrvReport: MrvReport; anomalies: Anomaly[] }>("/api/mrv/calculate", body),
    submit: (id: string) => api.post<{ mrvReport: MrvReport }>(`/api/mrv/${id}/submit`),
    anomalies: () => api.get<{ anomalies: Anomaly[] }>("/api/mrv/anomalies"),
    resolveAnomaly: (id: string, resolutionNotes?: string) =>
      api.post<{ anomaly: Anomaly }>(`/api/mrv/anomalies/${id}/resolve`, { resolutionNotes }),
  },
  verifications: {
    list: () => api.get<{ verifications: Verification[] }>("/api/verifications"),
    detail: (id: string) => api.get<{ verification: Verification; findings: VerificationFinding[] }>(`/api/verifications/${id}`),
    assign: (body: { mrvReportId: string; verifierAgencyId: string }) =>
      api.post<{ verification: Verification }>("/api/verifications", body),
    toggleFinding: (verificationId: string, checkKey: string, isSatisfied: boolean) =>
      api.patch<{ finding: VerificationFinding }>(`/api/verifications/${verificationId}/findings/${checkKey}`, { isSatisfied }),
    approve: (id: string, notes?: string) => api.post<{ verification: Verification }>(`/api/verifications/${id}/approve`, { notes }),
    reject: (id: string, notes?: string) => api.post<{ verification: Verification }>(`/api/verifications/${id}/reject`, { notes }),
  },
  issuance: {
    list: () => api.get<{ issuanceRequests: IssuanceRequest[] }>("/api/issuance/requests"),
    request: (verificationId: string) => api.post<{ issuanceRequest: IssuanceRequest }>("/api/issuance/requests", { verificationId }),
    approve: (id: string) => api.post<{ batchId: string; cccIds: string[]; quantity: number }>(`/api/issuance/requests/${id}/approve`),
    reject: (id: string, reason?: string) => api.post(`/api/issuance/requests/${id}/reject`, { reason }),
  },
  registry: {
    list: (params?: { status?: string; mine?: boolean; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.mine) qs.set("mine", "true");
      if (params?.page) qs.set("page", String(params.page));
      const query = qs.toString();
      return api.get<{ credits: CarbonCredit[]; pagination: { page: number; pageSize: number; total: number } }>(
        `/api/registry${query ? `?${query}` : ""}`
      );
    },
    detail: (cccId: string) => api.get<{ credit: CarbonCredit; provenance: CccEvent[] }>(`/api/registry/${cccId}`),
    freeze: (cccId: string, reason?: string) => api.post(`/api/registry/${cccId}/freeze`, { reason }),
    unfreeze: (cccId: string) => api.post(`/api/registry/${cccId}/unfreeze`),
  },
  market: {
    orderBook: () => api.get<OrderBook>("/api/market/orderbook"),
    myOrders: () => api.get<{ orders: Order[] }>("/api/market/orders"),
    placeOrder: (body: { side: "BUY" | "SELL"; quantity: number; pricePerCcc: number }) =>
      api.post<{ order: Order }>("/api/market/orders", body),
    cancelOrder: (id: string) => api.post<{ order: Order }>(`/api/market/orders/${id}/cancel`),
    matchOrder: (id: string) => api.post<{ tradeId: string; quantity: number; price: number }>(`/api/market/orders/${id}/match`),
    trades: () => api.get<{ trades: unknown[] }>("/api/market/trades"),
  },
  retirements: {
    list: () => api.get<{ retirements: Retirement[] }>("/api/retirements"),
    retire: (cccId: string, reason: string) => api.post<{ retirementId: string; retirementNumber: string }>("/api/retirements", { cccId, reason }),
  },
  audit: {
    list: (page = 1) => api.get<{ auditLogs: AuditLogEntry[]; pagination: { total: number } }>(`/api/audit?page=${page}`),
  },
  organizations: {
    verifierAgencies: () =>
      api.get<{ verifierAgencies: { id: string; accreditation_id: string; accreditation_body: string; organizations: { name: string } }[] }>(
        "/api/organizations/verifier-agencies"
      ),
  },
  registrationRequests: {
    submit: (body: {
      companyName: string;
      facilityType?: string;
      addressLine: string;
      city: string;
      state: string;
      requestedRole?: string;
    }) => api.post<{ registrationRequest: RegistrationRequest }>("/api/registration-requests", body),
    list: (status?: string) =>
      api.get<{ registrationRequests: RegistrationRequest[] }>(
        `/api/registration-requests${status ? `?status=${status}` : ""}`
      ),
    approve: (id: string, body: { role: string; organizationId?: string; orgType?: string }) =>
      api.post<{ registrationRequest: RegistrationRequest }>(`/api/registration-requests/${id}/approve`, body),
    reject: (id: string, notes?: string) =>
      api.post<{ registrationRequest: RegistrationRequest }>(`/api/registration-requests/${id}/reject`, { notes }),
  },
};
