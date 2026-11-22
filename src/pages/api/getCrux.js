import { getReports } from "kruk";
import {
	convertHistoryData,
	EXPERIMENTAL_AD_NAMES,
	groupAdvancedByMetric,
	groupByMetricAndSort,
	HISTORY_METRIC_NAMES,
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
				experimental,
				metrics: HISTORY_METRIC_NAMES,
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
				({ url }) =>
					`No history data returned for ${url.replace(/^https?:\/\//, "")}`,
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
		const cruxDataByMetric = groupByMetricAndSort(cruxData.metrics);
		const warnings =
			Array.isArray(cruxData.metrics) && cruxData.metrics.length < urls.length
				? [
						`CrUX data was returned for only ${cruxData.metrics.length} of ${urls.length} URLs`,
					]
				: [];

		return new Response(
			JSON.stringify({
				cruxData,
				byMetric: { params: cruxData.params, metrics: cruxDataByMetric },
				advanced: {
					params: cruxData.params,
					metrics: groupAdvancedByMetric(cruxData.metrics),
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
