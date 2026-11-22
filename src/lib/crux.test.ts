import { describe, expect, it } from "vitest";
import { convertHistoryData, HISTORY_METRIC_NAMES, trendOf } from "./crux";

function dateParts(iso: string) {
	const [year, month, day] = iso.split("-").map(Number);
	return { year, month, day };
}

const collectionPeriods = ["2026-01-10", "2026-01-17", "2026-01-24"].map(
	(iso) => ({
		firstDate: dateParts("2025-12-14"),
		lastDate: dateParts(iso),
	}),
);

type HistoryMetrics = NonNullable<
	Parameters<typeof convertHistoryData>[0][number]["metrics"]
>;

function onePeriod(metrics: HistoryMetrics) {
	return {
		key: { url: "https://example.com" },
		collectionPeriods: [collectionPeriods[collectionPeriods.length - 1]],
		metrics,
	};
}

describe("convertHistoryData", () => {
	it("uses the latest collection period instead of falling back to older data", () => {
		const result = convertHistoryData([
			{
				key: { url: "https://example.com" },
				collectionPeriods,
				metrics: {
					cumulative_layout_shift: {
						percentilesTimeseries: { p75s: ["0.00", "0.05", null] },
						histogramTimeseries: [
							{ densities: [0.9, 0.8, "NaN"] },
							{ densities: [0.05, 0.15, "NaN"] },
							{ densities: [0.05, 0.05, "NaN"] },
						],
					},
					largest_contentful_paint: {
						percentilesTimeseries: { p75s: [1000, 2000, 2800] },
						histogramTimeseries: [
							{ densities: [0.9, 0.8, 0.6] },
							{ densities: [0.08, 0.15, 0.3] },
							{ densities: [0.02, 0.05, 0.1] },
						],
					},
					first_contentful_paint: {
						percentilesTimeseries: { p75s: [1000, 1200, 1500] },
						histogramTimeseries: [
							{ densities: [0.95, 0.9, 0.85] },
							{ densities: [0.04, 0.08, 0.12] },
							{ densities: [0.01, 0.02, 0.03] },
						],
					},
					experimental_time_to_first_byte: {
						percentilesTimeseries: { p75s: [400, 500, 600] },
						histogramTimeseries: [
							{ densities: [0.9, 0.85, 0.8] },
							{ densities: [0.08, 0.12, 0.15] },
							{ densities: [0.02, 0.03, 0.05] },
						],
					},
					interaction_to_next_paint: {
						percentilesTimeseries: { p75s: [100, 150, 180] },
						histogramTimeseries: [
							{ densities: [0.95, 0.9, 0.85] },
							{ densities: [0.04, 0.08, 0.12] },
							{ densities: [0.01, 0.02, 0.03] },
						],
					},
					round_trip_time: {
						percentilesTimeseries: { p75s: [50, 60, 70] },
						histogramTimeseries: [
							{ densities: [0.9, 0.85, 0.8] },
							{ densities: [0.08, 0.12, 0.15] },
							{ densities: [0.02, 0.03, 0.05] },
						],
					},
				},
			},
		]);

		const site = result.metrics?.[0];
		expect(result.params?.dates).toEqual([
			"2026-01-10",
			"2026-01-17",
			"2026-01-24",
		]);
		expect(site?.CLS?.p75).toBe("-");
		expect(site?.CLS?.rank).toBe("-");
		expect(site?.CLS?.histogram).toEqual([]);
		expect(site?.CLS?.p75s).toEqual([0, 0.05, null]);
		expect(site?.LCP?.p75).toBe(2800);
		expect(site?.LCP?.rank).toBe("average");
		expect(site?.LCP?.histogram).toEqual([60, 30, 10]);
		// CLS has no value in the latest period, so the three-CWV score is
		// unknown rather than silently 100 or based on an older week
		expect(site?.minimalGood).toBeNull();
	});

	it("computes minimalGood only when all stable CWV are present", () => {
		const complete = convertHistoryData([
			onePeriod({
				cumulative_layout_shift: {
					percentilesTimeseries: { p75s: ["0.00"] },
					histogramTimeseries: [
						{ densities: [0.95] },
						{ densities: [0.04] },
						{ densities: [0.01] },
					],
				},
				largest_contentful_paint: {
					percentilesTimeseries: { p75s: [2000] },
					histogramTimeseries: [
						{ densities: [0.9] },
						{ densities: [0.07] },
						{ densities: [0.03] },
					],
				},
				interaction_to_next_paint: {
					percentilesTimeseries: { p75s: [100] },
					histogramTimeseries: [
						{ densities: [0.85] },
						{ densities: [0.1] },
						{ densities: [0.05] },
					],
				},
			}),
		]);

		expect(complete.metrics?.[0]?.minimalGood).toBe(85);

		const incomplete = convertHistoryData([
			onePeriod({
				largest_contentful_paint: {
					percentilesTimeseries: { p75s: [2000] },
					histogramTimeseries: [
						{ densities: [0.9] },
						{ densities: [0.07] },
						{ densities: [0.03] },
					],
				},
				interaction_to_next_paint: {
					percentilesTimeseries: { p75s: [100] },
					histogramTimeseries: [
						{ densities: [0.85] },
						{ densities: [0.1] },
						{ densities: [0.05] },
					],
				},
			}),
		]);

		expect(incomplete.metrics?.[0]?.minimalGood).toBeNull();
	});

	it("converts string CLS values, NaN densities and soft-navigation metrics", () => {
		const result = convertHistoryData([
			onePeriod({
				cumulative_layout_shift: {
					percentilesTimeseries: { p75s: ["0.05"] },
					histogramTimeseries: [
						{ densities: ["0.9"] },
						{ densities: ["NaN"] },
						{ densities: [0.1] },
					],
				},
				largest_contentful_paint: {
					percentilesTimeseries: { p75s: [2000] },
					histogramTimeseries: [
						{ densities: [0.9] },
						{ densities: [0.07] },
						{ densities: [0.03] },
					],
				},
				interaction_to_next_paint: {
					percentilesTimeseries: { p75s: [100] },
					histogramTimeseries: [
						{ densities: [0.85] },
						{ densities: [0.1] },
						{ densities: [0.05] },
					],
				},
				experimental_largest_contentful_paint_with_softnavs: {
					percentilesTimeseries: { p75s: [3000] },
					histogramTimeseries: [
						{ densities: [0.7] },
						{ densities: [0.2] },
						{ densities: [0.1] },
					],
				},
				experimental_first_contentful_paint_with_softnavs: {
					percentilesTimeseries: { p75s: [1500] },
					histogramTimeseries: [
						{ densities: [0.8] },
						{ densities: [0.15] },
						{ densities: [0.05] },
					],
				},
			}),
		]);

		const site = result.metrics?.[0];
		expect(site?.CLS?.p75).toBe(0.05);
		expect(site?.CLS?.rank).toBe("good");
		expect(site?.CLS?.histogram).toEqual([90, 0, 10]);
		expect(site?.["LCP-SN"]?.p75).toBe(3000);
		expect(site?.["LCP-SN"]?.rank).toBe("average");
		expect(site?.["FCP-SN"]?.p75).toBe(1500);
		// soft-navigation variants do not decide the stable CWV score
		expect(site?.minimalGood).toBe(85);
	});

	it("returns an error for an empty history response", () => {
		expect(convertHistoryData([])).toEqual({ error: "data not found" });
	});
});

describe("trendOf", () => {
	const dates = ["2026-01-10", "2026-01-17", "2026-01-24"];

	it("compares the exact selected week", () => {
		expect(trendOf([100, 100, 120], 1, dates)).toMatchObject({
			dir: "worse",
			label: "▲20%",
		});
		expect(trendOf([100, 100, 80], 1, dates)).toMatchObject({
			dir: "better",
			label: "▼20%",
		});
	});

	it("does not silently skip over a missing comparison week", () => {
		expect(trendOf([100, null, 120], 1, dates)).toBeNull();
		expect(trendOf([100, 100, null], 1, dates)).toBeNull();
	});

	it("reports a real change from a zero baseline", () => {
		const trend = trendOf([0, 0.05], 1, dates);
		expect(trend?.dir).toBe("worse");
		expect(trend?.label).toBe("▲");
		expect(trend?.title).toContain("from 0 to 0.05");
	});

	it("ignores changes below the threshold", () => {
		expect(trendOf([100, 101], 1, dates)).toBeNull();
	});

	it("uses the comparison period's 28-day range in the title", () => {
		expect(trendOf([100, 120], 1, dates)?.title).toContain("10/01/2026");
	});
});

describe("HISTORY_METRIC_NAMES", () => {
	it("requests only stable metrics for history", () => {
		expect(HISTORY_METRIC_NAMES).toEqual([
			"cumulative_layout_shift",
			"first_contentful_paint",
			"largest_contentful_paint",
			"experimental_time_to_first_byte",
			"interaction_to_next_paint",
			"round_trip_time",
		]);
	});
});
