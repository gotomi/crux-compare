import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { getReports } from "kruk";
import prependHttp from "prepend-http";

function groupByMetricAndSort(data, sortBy = "histogram") {
  if (!data) return {};
  const byMetric = { CLS: [], FCP: [], LCP: [], INP: [], TTFB: [], RTT: [] };

  data.forEach((site) => {
    for (const metric in byMetric) {
      if (site[metric]) {
        byMetric[metric].push({ url: site.url, ...site[metric] });
      }
    }
  });

  for (const metric in byMetric) {
    byMetric[metric].sort((a, b) => {
      const aValue =
        sortBy === "histogram" ? parseFloat(a.histogram?.[0] ?? 0) : parseFloat(b.p75 ?? 0);
      const bValue =
        sortBy === "histogram" ? parseFloat(b.histogram?.[0] ?? 0) : parseFloat(a.p75 ?? 0);

      return bValue - aValue;
    });
  }

  return byMetric;
}

/**
 * Create a fresh MCP server instance with the crux tool registered.
 * Called per-request for stateless serverless compatibility.
 */
function createServer() {
  const server = new McpServer({
    name: "crux-mcp",
    version: "1.0.0",
  });

  server.tool(
    "get-crux-data",
    "Get Chrome UX Report data for given URLs. Returns Core Web Vitals metrics (CLS, FCP, LCP, INP, TTFB) with histogram distributions and p75 values.",
    {
      urls: z.array(z.string()).describe("List of URLs to check"),
      formFactor: z.enum(["DESKTOP", "PHONE", "TABLET"]).optional().describe("Form factor to check"),
      checkOrigin: z.boolean().optional().describe("If true, queries origin data instead of URL data")
    },
    async ({ urls, formFactor, checkOrigin }) => {
      const API_KEY = process.env.PSIKUS;
      if (!API_KEY) {
        return {
          isError: true,
          content: [{ type: "text", text: "Missing API key configuration: PSIKUS environment variable is not set" }]
        };
      }

      try {
        const processedUrls = urls.map((url) => prependHttp(url));
        const queryParams = {
          effectiveConnectionType: "",
          formFactor: formFactor || "",
          origin: checkOrigin === true,
        };

        const cruxData = await getReports(processedUrls, API_KEY, queryParams);
        const cruxDataByMetric = groupByMetricAndSort(cruxData.metrics);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                cruxData,
                byMetric: { params: cruxData.params, metrics: cruxDataByMetric },
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching Crux Data: ${error.message}` }]
        };
      }
    }
  );

  return server;
}

// CORS headers shared across responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id",
};

export const ALL = async ({ request }) => {
  try {
    // Create a fresh server and stateless transport per request
    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      // Stateless mode: no session tracking (required for serverless)
      sessionIdGenerator: undefined,
    });

    // Connect server to transport
    await server.connect(transport);

    // Handle the incoming request
    const res = await transport.handleRequest(request);

    // Append CORS headers to the response
    const headers = new Headers(res.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      headers.set(key, value);
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (error) {
    console.error("MCP transport error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    });
  }
};

export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};
