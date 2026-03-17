/**
 * ROI Calculation Engine
 * Calculates ROI for Netwrix Privilege Secure (NPS) + Netwrix Endpoint Policy Manager (NEPM)
 */

export interface ROIInputs {
  admins: number;        // Identity/Access Engineers (Q7)
  limited_admins: number; // IT and Security Staff (Q6)
  endpoints: number;     // Employees / Endpoints (Q3)
  admin_salary: number;  // Annual cost of an Identity/Access Engineer (Q8)
  it_salary: number;     // Annual cost of an IT/Security staff member (Q9)
}

export interface ROIResults {
  npsCost: number;
  nepmCost: number;
  implementationCost: number;
  initialInvestment: number;
  annualSavings: number;
  discountedSavings: number;
  roi: number;
  paybackMonths: number;
}

const DISCOUNT_RATE = 0.12;
const IMPLEMENTATION_COST = 5000;

/**
 * Calculate NPS cost based on admin and limited admin counts
 */
function calculateNPSCost(admins: number, limitedAdmins: number): number {
  if (admins <= 5) {
    return 5 * 1075.25 + limitedAdmins * 90.97;
  }
  return admins * 1075.25 + limitedAdmins * 90.97;
}

/**
 * Calculate NEPM cost based on endpoint count
 */
function calculateNEPMCost(endpoints: number): number {
  if (endpoints <= 100) {
    return 100 * 38.72;
  }
  return endpoints * 38.72;
}

/**
 * Calculate annual cost savings
 * 50% of admins × $175K salary savings + 10% of limited admins × $150K productivity savings
 */
function calculateAnnualSavings(admins: number, limitedAdmins: number, adminSalary: number, itSalary: number): number {
  return (0.25 * admins * adminSalary) + (0.05 * (limitedAdmins - admins) * itSalary);
}

/**
 * Calculate discounted savings over 3 years
 */
function calculateDiscountedSavings(annualSavings: number): number {
  return (
    annualSavings +
    annualSavings / (1 + DISCOUNT_RATE) +
    annualSavings / Math.pow(1 + DISCOUNT_RATE, 2)
  );
}

/**
 * Main ROI calculation function
 */
export function calculateROI(inputs: ROIInputs): ROIResults {
  const npsCost = calculateNPSCost(inputs.admins, inputs.limited_admins);
  const nepmCost = calculateNEPMCost(inputs.endpoints);
  const initialInvestment = npsCost + nepmCost + IMPLEMENTATION_COST;

  const annualSavings = calculateAnnualSavings(inputs.admins, inputs.limited_admins, inputs.admin_salary, inputs.it_salary);
  const discountedSavings = calculateDiscountedSavings(annualSavings);

  const roi = discountedSavings / initialInvestment;
  const paybackMonths = (initialInvestment / discountedSavings) * 36;

  return {
    npsCost,
    nepmCost,
    implementationCost: IMPLEMENTATION_COST,
    initialInvestment,
    annualSavings,
    discountedSavings,
    roi,
    paybackMonths,
  };
}

/**
 * Format a number as US currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format ROI as percentage
 */
export function formatROI(roi: number): string {
  return `${Math.round(roi * 100).toLocaleString()}%`;
}

/**
 * Format payback period
 */
export function formatPayback(months: number): string {
  if (months < 1) {
    return 'Less than 1 month';
  }
  const rounded = Math.round(months * 10) / 10;
  return `${rounded} month${rounded !== 1 ? 's' : ''}`;
}
