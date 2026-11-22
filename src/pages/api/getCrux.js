import { buildQueryParams, getReports, runQuery } from "kruk";
import {
	convertHistoryData,
	EXPERIMENTAL_AD_NAMES,
	groupAdvancedByMetric,
	groupByMetricAndSort,
	historyMetricSelection,
	REQUEST_METRIC_NAMES,
	sanitizeError,
	validateFormFactor,
	validateUrls,
} from "../../lib/crux";
import { fetchHistoryRecords } from "../../lib/historyApi";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Accept",
};

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: corsHeaders,
	});
}

/**
 * kruk's getReports() swallows per-URL errors, so a short or empty result
 * cannot say why. Re-query one failed URL directly to keep the API's reason
 * (invalid key, quota, missing data) in the response.
 */
async function probeFailureReason(url, apiKey, queryParams) {
	try {
		await runQuery(apiKey, buildQueryParams(queryParams, url));
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : "Unknown error";
	}
}

// kruk strips the scheme from record URLs and the API normalizes url/origin
// (adds a trailing slash, drops the path for origin queries), so compare the
// same canonical form before deciding which input is missing from the result
function requestUrlKey(url, origin) {
	try {
		const parsed = new URL(url);
		return (origin ? parsed.origin : parsed.href).replace(/^https?:\/\//, "");
	} catch {
		return url.replace(/^https?:\/\//, "");
	}
}

export async function POST({ request }) {
	try {
		const body = await request.text();
		const params = new URLSearchParams(body);
		const checkOrigin = params.get("checkOrigin") !== null;
		const history = params.get("history") !== null;
		const experimental = params.get("experimental") !== null;

		const formFactor = validateFormFactor(params.get("formFactor"));
		const rawUrls = params
			.getAll("url")
			.filter((item) => item.trim().length > 0);
		const urls = validateUrls(rawUrls);

		const API_KEY = process.env.PSIKUS;

		if (!API_KEY) {
			return new Response(
				JSON.stringify({ error: "Missing API key configuration" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		if (history) {
			const historyResult = await fetchHistoryRecords({
				urls,
				apiKey: API_KEY,
				formFactor,
				origin: checkOrigin,
				// exactly the metrics convertHistoryData renders: kruk's
				// experimental flag would also add the unused NAV_TYPES-SN
				metrics: historyMetricSelection(experimental),
				periods: 25,
			});

			for (const failure of historyResult.failures) {
				console.error(
					`CrUX history request failed for ${failure.url}:`,
					failure.message,
				);
			}

			if (historyResult.records.length === 0) {
				return new Response(
					JSON.stringify({
						error: "No CrUX history data returned for the requested URLs",
					}),
					{
						status: 502,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					},
				);
			}

			const cruxData = convertHistoryData(historyResult.records);
			const cruxDataByMetric = groupByMetricAndSort(cruxData.metrics);
			const warnings = historyResult.failures.map(
				({ url, message }) =>
					`No history data returned for ${url.replace(/^https?:\/\//, "")}${message ? ` (${message})` : ""}`,
			);

			return new Response(
				JSON.stringify({
					cruxData,
					byMetric: { params: cruxData.params, metrics: cruxDataByMetric },
					...(warnings.length ? { warnings } : {}),
				}),
				{
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const queryParams = {
			formFactor: formFactor,
			origin: checkOrigin,
			history: false,
			experimental,
			metrics: experimental
				? [...REQUEST_METRIC_NAMES, ...EXPERIMENTAL_AD_NAMES]
				: REQUEST_METRIC_NAMES,
		};

		const cruxData = await getReports(urls, API_KEY, queryParams);

		if (cruxData.error) {
			const reason = await probeFailureReason(urls[0], API_KEY, queryParams);
			return new Response(
				JSON.stringify({
					error: reason
						? `No CrUX data returned for the requested URLs (${reason})`
						: "No CrUX data returned for the requested URLs",
				}),
				{
					status: 502,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const records = cruxData.metrics ?? [];
		const cruxDataByMetric = groupByMetricAndSort(records);
		const warnings = [];

		// Compare counts, not URLs: the API normalizes url to origin (or to a
		// canonical href with a trailing slash), so a name mismatch alone does
		// not mean a failure.
		if (records.length < urls.length) {
			const returnedUrls = new Set(records.map((item) => item.url));
			const missingUrl =
				urls.find(
					(url) => !returnedUrls.has(requestUrlKey(url, checkOrigin)),
				) ?? urls[0];
			const reason = await probeFailureReason(missingUrl, API_KEY, queryParams);
			warnings.push(
				`CrUX data was returned for only ${records.length} of ${urls.length} URLs${reason ? ` (${reason})` : ""}`,
			);
		}

		return new Response(
			JSON.stringify({
				cruxData,
				byMetric: { params: cruxData.params, metrics: cruxDataByMetric },
				advanced: {
					params: cruxData.params,
					metrics: groupAdvancedByMetric(records),
				},
				...(warnings.length ? { warnings } : {}),
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error in getCrux endpoint:", error);

		const message = sanitizeError(error);
		const status =
			message.includes("Invalid URL") ||
			message.includes("Invalid form factor") ||
			message.includes("At least one") ||
			message.includes("Maximum")
				? 400
				: 500;

		return new Response(JSON.stringify({ error: message }), {
			status,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
}
