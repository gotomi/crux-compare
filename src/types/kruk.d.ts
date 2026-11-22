// kruk ships plain ESM without declarations (package.json has no "types"
// field). These declarations cover the public API the app uses; the response
// shapes are converted by kruk itself, so they stay loosely typed here.
declare module "kruk" {
	export interface CruxQueryParams {
		formFactor?: string;
		origin?: boolean;
		history?: boolean;
		experimental?: boolean;
		metrics?: string[];
		periods?: number;
	}

	export interface CruxApiResponse {
		record?: unknown;
		urlNormalizationDetails?: unknown;
		[key: string]: unknown;
	}

	export interface CruxReport {
		params?: Record<string, unknown>;
		metrics?: Array<Record<string, unknown>>;
		error?: string;
		[key: string]: unknown;
	}

	export function buildQueryParams(
		params: CruxQueryParams,
		url: string,
	): Record<string, unknown>;

	export function runQuery(
		apiKey: string,
		cruxQueryParams: Record<string, unknown>,
		history?: boolean,
	): Promise<CruxApiResponse>;

	export function getReports(
		urls: string[],
		apiKey: string,
		params: CruxQueryParams,
		groupByMetric?: boolean,
	): Promise<CruxReport>;
}
