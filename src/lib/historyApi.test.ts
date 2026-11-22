import { buildQueryParams, runQuery } from "kruk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHistoryRecords } from "./historyApi";

vi.mock("kruk", () => ({
	buildQueryParams: vi.fn((params: Record<string, unknown>, url: string) => ({
		...params,
		url,
	})),
	runQuery: vi.fn(),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe("fetchHistoryRecords", () => {
	it("keeps successful records and reports failures per URL", async () => {
		vi.mocked(runQuery).mockImplementation(async (_key, query) => {
			const url = String(query.url ?? "");
			if (url.includes("bad")) {
				throw new Error("URL not found");
			}
			return { record: { key: { url } } };
		});

		const result = await fetchHistoryRecords({
			urls: ["https://good.example", "https://bad.example"],
			apiKey: "test-key",
			origin: false,
			metrics: ["largest_contentful_paint"],
		});

		expect(result.records).toHaveLength(1);
		expect(result.failures).toEqual([
			{ url: "https://bad.example", message: "URL not found" },
		]);
		expect(runQuery).toHaveBeenCalledTimes(2);
		expect(buildQueryParams).toHaveBeenCalledWith(
			expect.objectContaining({
				history: true,
				periods: 25,
				experimental: false,
				metrics: ["largest_contentful_paint"],
			}),
			"https://good.example",
		);
	});

	it("treats a successful response without a record as a failure", async () => {
		vi.mocked(runQuery).mockResolvedValue({});

		const result = await fetchHistoryRecords({
			urls: ["https://example.com"],
			apiKey: "test-key",
			origin: true,
			metrics: [],
		});

		expect(result.records).toEqual([]);
		expect(result.failures).toEqual([
			{ url: "https://example.com", message: "No record returned" },
		]);
	});
});
