import prependHttp from "prepend-http";

export type MetricKey = "CLS" | "FCP" | "LCP" | "INP" | "TTFB" | "RTT";

export const CORE_WEB_VITALS: MetricKey[] = ["LCP", "CLS", "INP"];

export const METRIC_KEYS: MetricKey[] = [
	"LCP",
	"CLS",
	"INP",
	"TTFB",
	"FCP",
	"RTT",
];

export const TABLE_METRIC_KEYS: MetricKey[] = [
	"LCP",
	"CLS",
	"INP",
	"TTFB",
	"FCP",
];

export const FORM_FACTORS = [
	"ALL_FORM_FACTORS",
	"PHONE",
	"DESKTOP",
	"TABLET",
] as const;
export type FormFactor = (typeof FORM_FACTORS)[number];

export const VALID_FORM_FACTORS: string[] = [
	"PHONE",
	"DESKTOP",
	"TABLET",
	"ALL_FORM_FACTORS",
];

export const MAX_URLS = 10;

// "good" and "average" upper bounds per metric, matching the CrUX assessment
export const METRIC_THRESHOLDS: Record<MetricKey, [number, number]> = {
	CLS: [0.1, 0.25],
	FCP: [1800, 3000],
	LCP: [2500, 4000],
	TTFB: [800, 1800],
	INP: [200, 500],
	RTT: [75, 275],
};

const RAW_METRIC_KEYS: Record<string, MetricKey> = {
	cumulative_layout_shift: "CLS",
	first_contentful_paint: "FCP",
	largest_contentful_paint: "LCP",
	experimental_time_to_first_byte: "TTFB",
	interaction_to_next_paint: "INP",
	round_trip_time: "RTT",
};

// kruk 0.5.0-beta advanced metrics: fraction distributions (no p75, no thresholds)
export const FRACTION_METRIC_KEYS = [
	"NAV_TYPES",
	"FORM_FACTORS",
	"LCP-RES",
] as const;

// LCP image phase breakdown: independent p75s in ms, no thresholds
export const SUBPART_METRIC_KEYS = [
	"LCP-TTFB",
	"LCP-LD",
	"LCP-LDur",
	"LCP-RD",
] as const;

export const ADVANCED_METRIC_KEYS = [
	...FRACTION_METRIC_KEYS,
	...SUBPART_METRIC_KEYS,
] as const;

export type AdvancedMetricKey = (typeof ADVANCED_METRIC_KEYS)[number];

const ADVANCED_RAW_NAMES: Record<string, string> = {
	navigation_types: "NAV_TYPES",
	form_factors: "FORM_FACTORS",
	largest_contentful_paint_resource_type: "LCP-RES",
	largest_contentful_paint_image_time_to_first_byte: "LCP-TTFB",
	largest_contentful_paint_image_resource_load_delay: "LCP-LD",
	largest_contentful_paint_image_resource_load_duration: "LCP-LDur",
	largest_contentful_paint_image_element_render_delay: "LCP-RD",
};

// metric names sent to the CrUX API: the classic 6 plus the advanced 7
// (kruk falls back to just the classic 6 when metrics is omitted)
export const REQUEST_METRIC_NAMES: string[] = [
	...Object.keys(RAW_METRIC_KEYS),
	...Object.keys(ADVANCED_RAW_NAMES),
];

export function metricRank(
	value: number,
	metric: MetricKey,
): "good" | "average" | "poor" {
	const [good, average] = METRIC_THRESHOLDS[metric];
	if (value > average) return "poor";
	if (value > good) return "average";
	return "good";
}

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
		throw new Error("At least one URL is required");
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
	sortBy: "histogram" | "p75" = "histogram",
): Partial<Record<MetricKey, Array<{ url: string } & CruxMetric>>> {
	if (!data) return {};

	const byMetric: Partial<
		Record<MetricKey, Array<{ url: string } & CruxMetric>>
	> = {};
	for (const key of METRIC_KEYS) {
		byMetric[key] = [];
	}

	for (const site of data) {
		for (const metric of METRIC_KEYS) {
			if (site[metric]) {
				byMetric[metric]?.push({ url: site.url, ...site[metric] });
			}
		}
	}

	for (const metric of METRIC_KEYS) {
		byMetric[metric]?.sort((a, b) => {
			const aVal =
				sortBy === "histogram"
					? parseFloat(String(a.histogram?.[0] ?? 0))
					: parseFloat(String(a.p75 ?? 0));
			const bVal =
				sortBy === "histogram"
					? parseFloat(String(b.histogram?.[0] ?? 0))
					: parseFloat(String(b.p75 ?? 0));

			return bVal - aVal;
		});
	}

	return byMetric;
}

export function sanitizeError(error: unknown): string {
	if (error instanceof Error) {
		const msg = error.message;
		if (msg.includes("API key") || msg.includes("quota")) {
			return "Service temporarily unavailable. Please try again later.";
		}

		if (msg.includes("Invalid URL")) {
			return msg;
		}

		return "Failed to fetch CrUX data. Please check your URLs and try again.";
	}

	return "An unexpected error occurred. Please try again.";
}

interface DateParts {
	year: number;
	month: number;
	day: number;
}

interface RawHistoryBin {
	start?: string;
	end?: string;
	densities?: Array<number | string | null>;
}

interface RawHistoryMetric {
	histogramTimeseries?: RawHistoryBin[];
	// the API returns small decimal p75s (e.g. CLS) as strings like "0.00"
	percentilesTimeseries?: { p75s?: Array<number | string | null> };
}

interface RawHistoryRecord {
	key?: { url?: string; origin?: string; formFactor?: string };
	metrics?: Record<string, RawHistoryMetric>;
	collectionPeriods?: Array<{ firstDate?: DateParts; lastDate?: DateParts }>;
}

// Latest-week snapshot (keeps Metric/UrlsByMetric working) plus the weekly series
export interface MetricHistory {
	histogram: number[];
	p75: number | "-";
	rank: string;
	p75s: Array<number | null>;
	histograms: number[][];
	ranks: Array<string | null>;
}

export interface HistorySite {
	url: string;
	CLS?: MetricHistory;
	FCP?: MetricHistory;
	LCP?: MetricHistory;
	INP?: MetricHistory;
	TTFB?: MetricHistory;
	RTT?: MetricHistory;
	minimalGood: number;
}

export interface HistoryParams {
	url?: boolean;
	origin?: boolean;
	formFactor?: string;
	history: boolean;
	weeks: number;
	// end date of each weekly collection period, aligned with the series indexes
	dates: string[];
	collectionPeriod?: { firstDate?: DateParts; lastDate?: DateParts };
}

export interface HistoryConversion {
	params?: HistoryParams;
	metrics?: HistorySite[];
	error?: string;
}

function isoDate(date: DateParts): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

const MISSING_METRIC: MetricHistory = {
	histogram: [],
	p75: "-",
	rank: "-",
	p75s: [],
	histograms: [],
	ranks: [],
};

// the API mixes numbers and numeric strings ("0.00") in its series
function toNumberOrNull(
	value: number | string | null | undefined,
): number | null {
	const n = typeof value === "string" ? Number(value) : value;
	return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function convertMetricHistory(
	raw: RawHistoryMetric,
	metric: MetricKey,
): MetricHistory {
	const p75s = (raw.percentilesTimeseries?.p75s ?? []).map(toNumberOrNull);
	const bins = raw.histogramTimeseries ?? [];
	const weeks = p75s.length || bins[0]?.densities?.length || 0;

	const histograms: number[][] = [];
	for (let week = 0; week < weeks; week++) {
		histograms.push(
			bins.map((bin) => {
				const density = toNumberOrNull(bin.densities?.[week]);
				return density === null ? 0 : Math.round(density * 10000) / 100;
			}),
		);
	}

	const ranks: Array<string | null> = p75s.map((value) =>
		value === null ? null : metricRank(value, metric),
	);

	let latest = -1;
	for (let i = p75s.length - 1; i >= 0; i--) {
		if (p75s[i] !== null) {
			latest = i;
			break;
		}
	}

	const latestP75 = latest >= 0 ? p75s[latest] : undefined;
	if (typeof latestP75 !== "number") {
		return { ...MISSING_METRIC, p75s, histograms, ranks };
	}

	return {
		histogram: histograms[latest] ?? [],
		p75: latestP75,
		rank: ranks[latest] ?? "-",
		p75s,
		histograms,
		ranks,
	};
}

export function convertHistoryData(
	data: RawHistoryRecord[],
): HistoryConversion {
	if (!data || data.length === 0) {
		return { error: "data not found" };
	}

	const key = data[0].key ?? {};
	const periods = data[0].collectionPeriods ?? [];

	const dates = periods
		.map((period) => period.lastDate)
		.filter((date): date is DateParts => !!date)
		.map(isoDate);

	const params: HistoryParams = {
		history: true,
		weeks: dates.length,
		dates,
		// latest 28-day collection period — the window the table values are computed over
		collectionPeriod: {
			firstDate: periods.at(-1)?.firstDate,
			lastDate: periods.at(-1)?.lastDate,
		},
	};
	if (key.url) params.url = true;
	if (key.origin) params.origin = true;
	if (key.formFactor) params.formFactor = key.formFactor;

	const metrics = data.map((record): HistorySite => {
		const item: HistorySite = {
			url: ((record.key?.url || record.key?.origin) ?? "")
				.replaceAll("https://", "")
				.replaceAll("http://", ""),
			minimalGood: 100,
		};

		for (const [rawName, abbr] of Object.entries(RAW_METRIC_KEYS)) {
			const raw = record.metrics?.[rawName];
			const history = raw
				? convertMetricHistory(raw, abbr)
				: { ...MISSING_METRIC };
			item[abbr] = history;

			if (
				CORE_WEB_VITALS.includes(abbr) &&
				typeof history.histogram[0] === "number"
			) {
				item.minimalGood = Math.min(item.minimalGood, history.histogram[0]);
			}
		}

		return item;
	});

	metrics.sort((a, b) => b.minimalGood - a.minimalGood);

	return { params, metrics };
}

// --- kruk 0.5.0-beta advanced metrics ----------------------------------------

// fraction distribution in percents summing to ~100 (kruk converts the 0..1 API values)
export interface FractionMetric {
	fractions: Record<string, number>;
}

// LCP image subpart: independent p75 in milliseconds, no good/average/poor thresholds
export interface SubpartMetric {
	p75: number;
}

export type AdvancedMetric = FractionMetric | SubpartMetric;

export interface AdvancedSite {
	url: string;
	NAV_TYPES?: FractionMetric;
	FORM_FACTORS?: FractionMetric;
	"LCP-RES"?: FractionMetric;
	"LCP-TTFB"?: SubpartMetric;
	"LCP-LD"?: SubpartMetric;
	"LCP-LDur"?: SubpartMetric;
	"LCP-RD"?: SubpartMetric;
}

export type AdvancedGroupedMetrics = Partial<
	Record<AdvancedMetricKey, Array<{ url: string } & AdvancedMetric>>
>;

// kruk already sorts sites by minimalGood; keep that order so the advanced view
// lists URLs in the same sequence as the overview table
export function groupAdvancedByMetric(
	data: AdvancedSite[] | null | undefined,
): AdvancedGroupedMetrics {
	if (!data) return {};

	const grouped: AdvancedGroupedMetrics = {};
	for (const key of ADVANCED_METRIC_KEYS) {
		grouped[key] = [];
	}

	for (const site of data) {
		for (const key of ADVANCED_METRIC_KEYS) {
			const metric = site[key];
			if (!metric) continue;

			if ("fractions" in metric) {
				if (metric.fractions && Object.keys(metric.fractions).length > 0) {
					grouped[key]?.push({ url: site.url, fractions: metric.fractions });
				}
			} else if (typeof metric.p75 === "number") {
				grouped[key]?.push({ url: site.url, p75: metric.p75 });
			}
		}
	}

	// drop empty keys so the UI can hide those sections entirely
	for (const key of ADVANCED_METRIC_KEYS) {
		if (grouped[key]?.length === 0) {
			delete grouped[key];
		}
	}

	return grouped;
}
