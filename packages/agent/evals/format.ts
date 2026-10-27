const PERCENT = 100;
const COST_DECIMALS = 5;
const NOT_AVAILABLE = 'n/d';

export function percentText(rate: number | null): string {
  return rate === null ? NOT_AVAILABLE : `${Math.round(rate * PERCENT)}%`;
}

export function millisecondsText(value: number | null): string {
  return value === null ? NOT_AVAILABLE : `${Math.round(value)} ms`;
}

export function usdText(value: number): string {
  return `US$ ${value.toFixed(COST_DECIMALS)}`;
}

export function padRight(text: string, width: number): string {
  return text.padEnd(width);
}

export function verdictText(met: boolean): string {
  return met ? 'ok' : 'abaixo da meta';
}
