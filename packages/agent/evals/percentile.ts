const FULL_RATIO = 1;

export function percentile(values: number[], ratio: number): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((first, second) => first - second);
  const rank = Math.ceil(Math.min(ratio, FULL_RATIO) * sorted.length);
  return sorted[Math.max(rank - 1, 0)] ?? null;
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}
