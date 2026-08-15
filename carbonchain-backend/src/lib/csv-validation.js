/**
 * CSV parsing + validation for meter reading uploads.
 * Expected columns: reading_type,reading_timestamp,value,unit
 * reading_type must be one of: ELECTRICITY, FUEL, PRODUCTION, EMISSIONS_DIRECT
 */

const VALID_TYPES = ["ELECTRICITY", "FUEL", "PRODUCTION", "EMISSIONS_DIRECT"];
const REQUIRED_COLUMNS = ["reading_type", "reading_timestamp", "value", "unit"];

export function parseAndValidateCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("VALIDATION_ERROR: CSV must have a header row and at least one data row");
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    throw new Error(`VALIDATION_ERROR: missing required columns: ${missing.join(", ")}`);
  }

  const colIndex = Object.fromEntries(header.map((h, i) => [h, i]));
  const seen = new Set();

  const valid = [];
  const rejected = [];
  const warnings = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const rowNum = i + 1;

    const readingType = cols[colIndex.reading_type];
    const readingTimestamp = cols[colIndex.reading_timestamp];
    const rawValue = cols[colIndex.value];
    const unit = cols[colIndex.unit];

    if (!VALID_TYPES.includes(readingType)) {
      rejected.push({ row: rowNum, reason: `invalid reading_type "${readingType}"` });
      continue;
    }

    const timestamp = new Date(readingTimestamp);
    if (Number.isNaN(timestamp.getTime())) {
      rejected.push({ row: rowNum, reason: `invalid timestamp "${readingTimestamp}"` });
      continue;
    }

    const value = Number(rawValue);
    if (Number.isNaN(value)) {
      rejected.push({ row: rowNum, reason: `non-numeric value "${rawValue}"` });
      continue;
    }
    if (value < 0) {
      rejected.push({ row: rowNum, reason: `negative value not allowed (${value})` });
      continue;
    }

    if (!unit) {
      rejected.push({ row: rowNum, reason: "missing unit" });
      continue;
    }

    const dedupeKey = `${readingType}|${timestamp.toISOString()}`;
    if (seen.has(dedupeKey)) {
      warnings.push({ row: rowNum, reason: "duplicate reading_type + timestamp within this file, skipped" });
      continue;
    }
    seen.add(dedupeKey);

    valid.push({
      reading_type: readingType,
      reading_timestamp: timestamp.toISOString(),
      value,
      unit,
    });
  }

  return {
    totalRows: lines.length - 1,
    valid,
    rejected,
    warnings,
  };
}
