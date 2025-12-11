/**
 * Price calculation algorithm for sellers.
 *
 * Formula:
 * - If W >= W0: price = P0 + (W - W0) * kUp
 * - If W < W0: price = P0 + (W - W0) * kDown
 *
 * Where:
 * - W = current weight
 * - W0 = baseline weight
 * - P0 = base price
 * - kUp = slope coefficient when weight is above baseline
 * - kDown = slope coefficient when weight is below baseline
 */

export interface PriceCalculatorParams {
  weight: number; // Current weight (W)
  baselineWeight: number; // Baseline weight (W0)
  basePrice: number; // Base price (P0)
  kUp: number; // Slope when W >= W0
  kDown: number; // Slope when W < W0
}

/**
 * Calculate price based on weight and parameters.
 *
 * @param params - The calculation parameters
 * @returns The calculated price rounded to 2 decimal places
 */
export function calculatePrice(params: PriceCalculatorParams): number {
  const { weight, baselineWeight, basePrice, kUp, kDown } = params;

  // Validate inputs
  if (
    typeof weight !== 'number' ||
    typeof baselineWeight !== 'number' ||
    typeof basePrice !== 'number' ||
    typeof kUp !== 'number' ||
    typeof kDown !== 'number'
  ) {
    throw new Error('All parameters must be numbers');
  }

  const weightDiff = weight - baselineWeight;

  let price: number;
  if (weightDiff >= 0) {
    // Weight is at or above baseline
    price = basePrice + weightDiff * kUp;
  } else {
    // Weight is below baseline
    price = basePrice + weightDiff * kDown;
  }

  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
}

/**
 * Validate price calculator parameters.
 *
 * @param params - The parameters to validate
 * @returns Object with isValid flag and error messages
 */
export function validatePriceParams(params: Partial<PriceCalculatorParams>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (params.baselineWeight !== undefined && params.baselineWeight <= 0) {
    errors.push('Baseline weight must be positive');
  }

  if (params.basePrice !== undefined && params.basePrice < 0) {
    errors.push('Base price cannot be negative');
  }

  if (params.weight !== undefined && params.weight <= 0) {
    errors.push('Weight must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
