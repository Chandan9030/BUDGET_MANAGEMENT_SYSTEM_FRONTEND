/**
 * Utility function to calculate the sum of an array of numbers.
 */
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

/**
 * Utility function to calculate the average of an array of numbers.
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return calculateSum(numbers) / numbers.length;
}

/**
 * Utility function to calculate the percentage of a value.
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}