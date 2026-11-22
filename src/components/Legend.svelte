<script>
let { metric } = $props();

const metricsMap = {
	CLS: { range: [0.1, 0.25], name: "Cumulative Layout Shift" },
	FCP: { range: [1800, 3000], name: "First Contentful Paint" },
	LCP: { range: [2500, 4000], name: "Largest Contentful Paint" },
	TTFB: { range: [800, 1800], name: "Time to First Byte" },
	INP: { range: [200, 500], name: "Interaction To Next Paint" },
	RTT: { range: [75, 275], name: "Round Trip Time" },
	"LCP-SN": {
		range: [2500, 4000],
		name: "Largest Contentful Paint incl. soft navigations",
	},
	"CLS-SN": {
		range: [0.1, 0.25],
		name: "Cumulative Layout Shift incl. soft navigations",
	},
	"INP-SN": {
		range: [200, 500],
		name: "Interaction To Next Paint incl. soft navigations",
	},
	"FCP-SN": {
		range: [1800, 3000],
		name: "First Contentful Paint incl. soft navigations",
	},
};

const metricData = $derived(metricsMap[metric]);
const unit = $derived(metric.startsWith("CLS") ? "" : "ms");
const isExperimental = $derived(metric.endsWith("-SN"));
const names = {
	metrics: {
		good: "Good",
		medium: "Needs Improvement",
		poor: "Poor",
	},
	rtt: {
		good: "Low",
		medium: "Medium",
		poor: "High",
	},
};

const rangeNames = $derived(metric === "RTT" ? names.rtt : names.metrics);

const unitLabel = $derived(unit ? ` ${unit}` : "");
</script>

<div class="legend-container">
    <div class="metric-header">
        <h2 title={metricData.name}>
            <span class="mobile">{metric}</span>
            <span class="desktop">{metricData.name}</span>
            {#if isExperimental}
                <span class="experimental-badge">experimental</span>
            {/if}
        </h2>
        {#if unit}
            <div
                class="metric-badge"
                class:good={metric.startsWith("CLS") || metric.startsWith("INP")}
                class:time={!metric.startsWith("CLS")}
            >
                {unit}
            </div>
        {/if}
    </div>
    <div class="legend-content">
        <div class="legend-item good">
            <div class="indicator"></div>
            <span class="legend-text"
                ><span class="legend-word">{rangeNames.good}</span> &lt;
                {metricData.range[0]}<span class="legend-unit"
                    >{unitLabel}</span
                ></span
            >
        </div>
        <div class="legend-item average">
            <div class="indicator"></div>
            <span class="legend-text"
                ><span class="legend-word">{rangeNames.medium}</span>
                {metricData.range[0]} - {metricData.range[1]}<span
                    class="legend-unit">{unitLabel}</span
                ></span
            >
        </div>
        <div class="legend-item poor">
            <div class="indicator"></div>
            <span class="legend-text"
                ><span class="legend-word">{rangeNames.poor}</span> &gt;
                {metricData.range[1]}<span class="legend-unit"
                    >{unitLabel}</span
                ></span
            >
        </div>
    </div>
</div>

<style>
    .legend-container {
        background: var(--surface);
        border-radius: 4px;
        padding: 20px;
        margin: 16px 0;
    }

    .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 12px;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-strong);
    }

    .experimental-badge {
        display: inline-block;
        vertical-align: middle;
        margin-left: 8px;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--warning-soft);
        color: var(--warning);
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .metric-badge {
        background: var(--surface-2);
        color: var(--text-muted);
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .metric-badge.good {
        background: var(--success-soft);
        color: var(--success);
    }

    .metric-badge.time {
        background: var(--info-soft);
        color: var(--info);
    }

    .legend-content {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 6px;
        transition: all var(--transition);
        background: var(--surface-2);
        border: 1px solid var(--border);
    }

    .legend-item:hover {
        background-color: var(--border);
        transform: translateY(-1px);
    }

    .indicator {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        flex-shrink: 0;
    }

    .legend-item.good .indicator {
        background-color: var(--chart-good);
    }

    .legend-item.average .indicator {
        background-color: var(--chart-fair);
    }

    .legend-item.poor .indicator {
        background-color: var(--chart-poor);
    }

    .legend-text {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-strong);
        white-space: nowrap;
    }

    .desktop {
        display: inline-block;
    }

    .mobile {
        display: none;
    }

    @media (max-width: 768px) {
        .legend-container {
            padding: 16px;
            margin: 12px 0;
        }

        h2 {
            font-size: 1.1rem;
        }

        .legend-item {
            padding: 4px 8px;
        }

        .legend-text {
            font-size: 0.8rem;
        }

        /* compact single-row legend: words stay for screen readers only,
           unit is already visible in the header badge */
        .legend-word {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        .legend-unit {
            display: none;
        }

        .desktop {
            display: none;
        }

        .mobile {
            display: inline-block;
        }
    }

    @media (max-width: 480px) {
        .legend-container {
            padding: 12px;
        }
    }
</style>
