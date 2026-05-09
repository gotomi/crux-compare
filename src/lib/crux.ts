import { z } from 'zod';
import prependHttp from 'prepend-http';

export type MetricKey = 'CLS' | 'FCP' | 'LCP' | 'INP' | 'TTFB' | 'RTT';

export const METRIC_KEYS: MetricKey[] = ['CLS', 'FCP', 'LCP', 'INP', 'TTFB', 'RTT'];

export const TABLE_METRIC_KEYS: MetricKey[] = ['FCP', 'LCP', 'CLS', 'TTFB', 'INP'];

export const FORM_FACTORS = ['ALL_FORM_FACTORS', 'PHONE', 'DESKTOP', 'TABLET'] as const;
export type FormFactor = (typeof FORM_FACTORS)[number];

export const VALID_FORM_FACTORS: string[] = ['PHONE', 'DESKTOP', 'TABLET', 'ALL_FORM_FACTORS'];

export const MAX_URLS = 10;

interface CruxMetric {
  histogram?: number[];
  p75?: number;
  rank?: string;
}

export interface CruxSite {
  url: string;
  CLS?: CruxMetric;
  FCP?: CruxMetric;
  LCP?: CruxMetric;
  INP?: CruxMetric;
  TTFB?: CruxMetric;
  RTT?: CruxMetric;
  minimalGood?: number;
}

export function normalizeUrl(url: string): string {
  const processed = prependHttp(url);
  try {
    new URL(processed);
    return processed;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

export function validateUrls(urls: string[]): string[] {
  if (!urls || urls.length === 0) {
    throw new Error('At least one URL is required');
  }

  if (urls.length > MAX_URLS) {
    throw new Error(`Maximum ${MAX_URLS} URLs allowed`);
  }

  return urls.map(normalizeUrl);
}

export function validateFormFactor(value: string | null): string | undefined {
  if (!value) return undefined;
  if (!VALID_FORM_FACTORS.includes(value)) {
    throw new Error(`Invalid form factor: ${value}`);
  }

  return value;
}

export function groupByMetricAndSort(
  data: CruxSite[] | null | undefined,
  sortBy: 'histogram' | 'p75' = 'histogram'
): Partial<Record<MetricKey, Array<{ url: string } & CruxMetric>>> {
  if (!data) return {};

  const byMetric: Partial<Record<MetricKey, Array<{ url: string } & CruxMetric>>> = {};
  for (const key of METRIC_KEYS) {
    byMetric[key] = [];
  }

  for (const site of data) {
    for (const metric of METRIC_KEYS) {
      if (site[metric]) {
        byMetric[metric]!.push({ url: site.url, ...site[metric]! });
      }
    }
  }

  for (const metric of METRIC_KEYS) {
    byMetric[metric]!.sort((a, b) => {
      const aVal =
        sortBy === 'histogram' ? parseFloat(String(a.histogram?.[0] ?? 0)) : parseFloat(String(a.p75 ?? 0));
      const bVal =
        sortBy === 'histogram' ? parseFloat(String(b.histogram?.[0] ?? 0)) : parseFloat(String(b.p75 ?? 0));

      return bVal - aVal;
    });
  }

  return byMetric;
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('API key') || msg.includes('quota')) {
      return 'Service temporarily unavailable. Please try again later.';
    }

    if (msg.includes('Invalid URL')) {
      return msg;
    }

    return 'Failed to fetch CrUX data. Please check your URLs and try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}
