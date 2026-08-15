/**
 * DETERMINISTIC EMISSIONS CALCULATION ENGINE
 *
 * Pure functions only — no AI, no randomness, no external calls. Given the
 * same inputs, this always produces the same outputs, which is what makes
 * a calculation reproducible and auditable (see mrv_calculations table:
 * every call to calculate() gets stored with its exact inputs).
 *
 * Methodology: CCTS-INTENSITY-V1 (demo methodology, loosely modeled on
 * real specific-emission-intensity approaches used in Indian sectoral
 * schemes — NOT an official BEE/CCTS-published formula).
 */

export const METHODOLOGY_VERSION = "CCTS-INTENSITY-V1";

// Conversion factors are versioned data, not hardcoded magic numbers
// buried in logic — stored alongside every calculation for audit replay.
export const DEFAULT_CONVERSION_FACTORS = {
  ELECTRICITY: { factor: 0.82, unit: "tCO2e/MWh", source: "DEMO CEA grid emission factor" },
  FUEL_COAL: { factor: 2.42, unit: "tCO2e/t coal", source: "DEMO IPCC default factor" },
  FUEL_NATURAL_GAS: { factor: 2.75, unit: "tCO2e/1000 Sm3", source: "DEMO IPCC default factor" },
};

/**
 * @param {object} params
 * @param {Array<{reading_type: string, value: number, unit: string}>} params.readings
 * @param {number} params.productionQuantity
 * @param {string} params.productionUnit
 * @param {number|null} params.baselineIntensity
 * @param {object} [params.conversionFactors] - defaults to DEFAULT_CONVERSION_FACTORS
 * @returns {{
 *   totalEmissionsTco2e: number,
 *   emissionIntensity: number|null,
 *   intensityUnit: string,
 *   inputSnapshot: object,
 *   conversionFactorsUsed: object,
 *   methodologyVersion: string
 * }}
 */
export function calculateEmissions({
  readings,
  productionQuantity,
  productionUnit,
  baselineIntensity = null,
  conversionFactors = DEFAULT_CONVERSION_FACTORS,
}) {
  if (!Array.isArray(readings) || readings.length === 0) {
    throw new Error("CALCULATION_ERROR: no readings supplied");
  }

  const totals = { ELECTRICITY: 0, FUEL: 0, PRODUCTION: 0, EMISSIONS_DIRECT: 0 };
  for (const r of readings) {
    if (!(r.reading_type in totals)) {
      throw new Error(`CALCULATION_ERROR: unknown reading_type ${r.reading_type}`);
    }
    if (typeof r.value !== "number" || Number.isNaN(r.value) || r.value < 0) {
      throw new Error(`CALCULATION_ERROR: invalid value for ${r.reading_type}: ${r.value}`);
    }
    totals[r.reading_type] += r.value;
  }

  // Direct CEMS-measured emissions take priority when present (most
  // accurate); otherwise derive from electricity + fuel via factors.
  let totalEmissionsTco2e;
  if (totals.EMISSIONS_DIRECT > 0) {
    totalEmissionsTco2e = round(totals.EMISSIONS_DIRECT, 4);
  } else {
    const electricityEmissions = totals.ELECTRICITY * conversionFactors.ELECTRICITY.factor;
    const fuelEmissions = totals.FUEL * conversionFactors.FUEL_COAL.factor;
    totalEmissionsTco2e = round(electricityEmissions + fuelEmissions, 4);
  }

  const production = productionQuantity ?? totals.PRODUCTION;
  const emissionIntensity =
    production && production > 0 ? round(totalEmissionsTco2e / production, 4) : null;

  return {
    totalEmissionsTco2e,
    emissionIntensity,
    intensityUnit: productionUnit ? `tCO2e/${productionUnit}` : null,
    baselineIntensity,
    inputSnapshot: {
      totals,
      productionQuantity: production,
      productionUnit,
      readingCount: readings.length,
    },
    conversionFactorsUsed: conversionFactors,
    methodologyVersion: METHODOLOGY_VERSION,
  };
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
