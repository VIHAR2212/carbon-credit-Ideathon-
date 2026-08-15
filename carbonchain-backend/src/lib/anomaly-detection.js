/**
 * RULE-BASED ANOMALY DETECTION ENGINE
 *
 * Deterministic rules only, run against two consecutive MRV calculations
 * for the same plant. An anomaly is a signal for human review, never an
 * automatic fraud accusation — status starts at DETECTED, a verifier or
 * registry admin moves it to UNDER_REVIEW / RESOLVED / DISMISSED.
 */

const RULES = [
  {
    code: "ELECTRICITY_PRODUCTION_DIVERGENCE",
    priority: "HIGH",
    evaluate(current, previous) {
      if (!previous) return null;
      const elecCurrent = current.inputSnapshot.totals.ELECTRICITY;
      const elecPrev = previous.inputSnapshot.totals.ELECTRICITY;
      const prodCurrent = current.inputSnapshot.productionQuantity;
      const prodPrev = previous.inputSnapshot.productionQuantity;

      if (!elecPrev || !prodPrev) return null;

      const elecChangePct = ((elecCurrent - elecPrev) / elecPrev) * 100;
      const prodChangePct = ((prodCurrent - prodPrev) / prodPrev) * 100;

      // Electricity up sharply while production barely moves.
      if (elecChangePct > 20 && prodChangePct < elecChangePct / 4) {
        return {
          title: "Electricity consumption vs production divergence",
          description: `Electricity consumption increased ${elecChangePct.toFixed(1)}% while production increased only ${prodChangePct.toFixed(1)}% over the same period.`,
          detectedValues: { elecChangePct: round1(elecChangePct), prodChangePct: round1(prodChangePct) },
        };
      }
      return null;
    },
  },
  {
    code: "SUDDEN_EMISSION_DROP",
    priority: "HIGH",
    evaluate(current, previous) {
      if (!previous) return null;
      const changePct =
        ((current.totalEmissionsTco2e - previous.totalEmissionsTco2e) / previous.totalEmissionsTco2e) * 100;
      if (changePct < -30) {
        return {
          title: "Sudden emissions drop without explanation",
          description: `Reported emissions fell ${Math.abs(changePct).toFixed(1)}% versus the previous reporting period.`,
          detectedValues: { changePct: round1(changePct) },
        };
      }
      return null;
    },
  },
  {
    code: "IMPOSSIBLE_INTENSITY",
    priority: "MEDIUM",
    evaluate(current) {
      if (current.emissionIntensity !== null && current.baselineIntensity) {
        const ratio = current.emissionIntensity / current.baselineIntensity;
        if (ratio < 0.3) {
          return {
            title: "Emission intensity implausibly below baseline",
            description: `Reported intensity (${current.emissionIntensity}) is less than 30% of the facility baseline (${current.baselineIntensity}), which is physically implausible without a documented process change.`,
            detectedValues: { ratio: round1(ratio) },
          };
        }
      }
      return null;
    },
  },
  {
    code: "MISSING_METER_PERIOD",
    priority: "MEDIUM",
    evaluate(current) {
      if (current.inputSnapshot.readingCount < 4) {
        return {
          title: "Sparse telemetry for reporting period",
          description: `Only ${current.inputSnapshot.readingCount} meter readings backed this calculation — below the expected minimum for a full reporting period.`,
          detectedValues: { readingCount: current.inputSnapshot.readingCount },
        };
      }
      return null;
    },
  },
];

/**
 * @param {object} currentCalc - result of calculateEmissions() for the new period
 * @param {object|null} previousCalc - result of calculateEmissions() for the prior period, or null
 * @returns {Array<{code: string, priority: string, title: string, description: string, detectedValues: object}>}
 */
export function detectAnomalies(currentCalc, previousCalc = null) {
  const findings = [];
  for (const rule of RULES) {
    const result = rule.evaluate(currentCalc, previousCalc);
    if (result) {
      findings.push({ code: rule.code, priority: rule.priority, ...result });
    }
  }
  return findings;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
