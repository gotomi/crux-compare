import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getReports } from "kruk";
import { z } from "zod";
import { getExpectedToken, validateAuth } from "../../lib/auth";
import {
	groupByMetricAndSort,
	MAX_URLS,
	validateFormFactor,
	validateUrls,
} from "../../lib/crux";
import { rateLimit } from "../../lib/rateLimit";

function createServer(): McpServer {
	const server = new McpServer({
		name: "crux-mcp",
		version: "1.0.0",
	});

	server.tool(
		"get-crux-data",
		"Get Chrome UX Report data for given URLs. Returns Core Web Vitals metrics (CLS, FCP, LCP, INP, TTFB) with histogram distributions and p75 values. Response includes raw cruxData and sorted byMetric structures.",
		{
			urls: z
				.array(z.string())
				.min(1, "At least one URL is required")
				.max(MAX_URLS, `Maximum ${MAX_URLS} URLs allowed`)
				.describe("List of URLs to check"),
			formFactor: z
				.enum(["DESKTOP", "PHONE", "TABLET"])
				.optional()
				.describe("Form factor to check"),
			checkOrigin: z
				.boolean()
				.optional()
				.describe("If true, queries origin data instead of URL data"),
		},
		async ({
			urls,
			formFactor,
			checkOrigin,
		}: {
			urls: string[];
			formFactor?: string;
			checkOrigin?: boolean;
		}) => {
			const API_KEY = process.env.PSIKUS;
			if (!API_KEY || typeof API_KEY !== "string" || API_KEY.trim() === "") {
				return {
					isError: true,
					content: [
						{
							type: "text" as const,
							text: "Missing API key configuration: PSIKUS environment variable is not set or empty",
						},
					],
				};
			}

			try {
				const processedUrls = validateUrls(urls);

				const queryParams: Record<string, unknown> = {
					origin: checkOrigin === true,
				};
				if (formFactor) {
					queryParams.formFactor = validateFormFactor(formFactor);
				}

				const cruxData = await getReports(processedUrls, API_KEY, queryParams);
				const cruxDataByMetric = groupByMetricAndSort(cruxData.metrics);

				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									cruxData,
									byMetric: {
										params: cruxData.params,
										metrics: cruxDataByMetric,
									},
								},
								null,
								2,
							),
						},
					],
				};
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error occurred";
				return {
					isError: true,
					content: [
						{
							type: "text" as const,
							text: `Error fetching Crux Data: ${message}`,
						},
					],
				};
			}
		},
	);

	return server;
}

export const ALL = async ({
	request,
}: {
	request: Request;
}): Promise<Response> => {
	const expectedToken = getExpectedToken();
	if (!expectedToken) {
		return new Response(
			JSON.stringify({
				error:
					"Server is not secured: MCP_TOKEN environment variable is not configured",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const auth = validateAuth(request);
	if (!auth.valid) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const rl = rateLimit(auth.identity);
	if (!rl.allowed) {
		return new Response(JSON.stringify({ error: "Too Many Requests" }), {
			status: 429,
			headers: {
				"Content-Type": "application/json",
				"Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
			},
		});
	}

	let server: McpServer | undefined;
	try {
		server = createServer();
		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
			enableJsonResponse: true,
		});

		await server.connect(transport);
		const res = await transport.handleRequest(request);

		await server.close();
		server = undefined;

		return res;
	} catch (error) {
		console.error("MCP transport error:", error);
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";

		if (server) {
			await server.close().catch(() => {});
			server = undefined;
		}

		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
