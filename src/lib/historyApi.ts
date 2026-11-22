import { buildQueryParams, runQuery } from "kruk";

export interface HistoryRequestParams {
	urls: string[];
	apiKey: string;
	formFactor?: string;
	origin: boolean;
	experimental: boolean;
	metrics: string[];
	periods?: number;
}

export interface HistoryFailure {
	url: string;
	message: string;
}

export interface HistoryRecords {
	records: unknown[];
	failures: HistoryFailure[];
}

/**
 * Query the CrUX History API without swallowing per-URL failures.
 *
 * kruk's getReports() catches request errors internally, which makes an API
 * error indistinguishable from a URL with no data. History needs raw records
 * anyway, so use the exported query builders directly and keep the failures.
 *
 * URLs must already be normalized by validateUrls().
 */
export async function fetchHistoryRecords({
	urls,
	apiKey,
	formFactor,
	origin,
	experimental,
	metrics,
	periods = 25,
}: HistoryRequestParams): Promise<HistoryRecords> {
	const params = {
		formFactor,
		origin,
		history: true,
		experimental,
		metrics,
		periods,
	};

	const settled = await Promise.allSettled(
		urls.map((url) => runQuery(apiKey, buildQueryParams(params, url), true)),
	);

	const records: unknown[] = [];
	const failures: HistoryFailure[] = [];

	settled.forEach((result, index) => {
		const url = urls[index];

		if (result.status === "rejected") {
			failures.push({
				url,
				message:
					result.reason instanceof Error
						? result.reason.message
						: "Unknown error",
			});
			return;
		}

		const record = result.value?.record;
		if (!record) {
			failures.push({ url, message: "No record returned" });
			return;
		}

		records.push(record);
	});

	return { records, failures };
}
