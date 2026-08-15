import crypto from "node:crypto";

export function sha256Hex(input) {
  return crypto.createHash("sha256").update(typeof input === "string" ? input : JSON.stringify(input)).digest("hex");
}

/**
 * Computes the hash for a carbon_credit_events row, chaining it to the
 * prior event's hash (if any) so the sequence is tamper-evident: changing
 * any historical event would break every hash after it.
 */
export function computeEventHash({ cccId, eventType, previousStatus, newStatus, timestamp, priorEventHash }) {
  return sha256Hex(
    `${cccId}|${eventType}|${previousStatus ?? ""}|${newStatus}|${timestamp}|${priorEventHash ?? "GENESIS"}`
  );
}

function pad(num, size) {
  return String(num).padStart(size, "0");
}

export function generateMrvNumber() {
  return `MRV-${Date.now()}${pad(Math.floor(Math.random() * 100), 2)}`;
}

export function generateAnomalyNumber() {
  const now = new Date();
  return `ANM-${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}-${pad(
    Math.floor(Math.random() * 10000),
    4
  )}`;
}

export function generateVerificationNumber(accreditationId) {
  const year = new Date().getFullYear();
  return `VER-${accreditationId}-${year}-${pad(Math.floor(Math.random() * 100000), 5)}`;
}

export function generateIssuanceNumber() {
  const year = new Date().getFullYear();
  return `ISS-${year}-${pad(Math.floor(Math.random() * 100000), 5)}`;
}

export function generateCccId(year, serial) {
  return `CCC-IN-${year}-${pad(serial, 8)}`;
}

export function generateOrderNumber() {
  const year = new Date().getFullYear();
  return `ORD-${year}-${pad(Math.floor(Math.random() * 10000), 4)}`;
}

export function generateTradeNumber() {
  return `TRD-${Date.now()}`;
}

export function generateRetirementNumber() {
  return `SUR-${pad(Math.floor(Math.random() * 100000), 5)}`;
}
