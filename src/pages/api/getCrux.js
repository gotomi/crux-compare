import { getReports } from "kruk";
import {
	validateUrls,
	validateFormFactor,
	groupByMetricAndSort,
	sanitizeError,
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
		};

		const cruxData = await getReports(urls, API_KEY, queryParams);
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
