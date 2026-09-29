import { getReports } from "kruk";
import {
	convertHistoryData,
	groupAdvancedByMetric,
	groupByMetricAndSort,
	REQUEST_METRIC_NAMES,
	sanitizeError,
	validateFormFactor,
	validateUrls,
} from "../../lib/crux";

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

		const queryParams = {
			effectiveConnectionType: "",
			formFactor: formFactor,
			origin: checkOrigin,
			history,
			metrics: REQUEST_METRIC_NAMES,
		};

		const cruxRaw = await getReports(urls, API_KEY, queryParams);

		if (history) {
			const cruxData = convertHistoryData(cruxRaw);
			const cruxDataByMetric = groupByMetricAndSort(cruxData.metrics);

			return new Response(
				JSON.stringify({
					cruxData,
					byMetric: { params: cruxData.params, metrics: cruxDataByMetric },
				}),
				{
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const cruxData = cruxRaw;
		const cruxDataByMetric = groupByMetricAndSort(cruxData.metrics);

		return new Response(
			JSON.stringify({
				cruxData,
				byMetric: { params: cruxData.params, metrics: cruxDataByMetric },
				advanced: {
					params: cruxData.params,
					metrics: groupAdvancedByMetric(cruxData.metrics),
				},
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
