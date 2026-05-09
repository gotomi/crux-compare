<script>
let { metric } = $props();

const metricsMap = {
	CLS: { range: [0.1, 0.25], name: "Cumulative Layout Shift" },
	FCP: { range: [1800, 3000], name: "First Contentful Paint" },
	LCP: { range: [2500, 4000], name: "Largest Contentful Paint" },
	TTFB: { range: [800, 1800], name: "Time to First Byte" },
	INP: { range: [200, 500], name: "Interaction To Next Paint" },
	RTT: { range: [75, 275], name: "Round Trip Time" },
};

const metricData = $derived(metricsMap[metric]);
const unit = $derived(metric === "CLS" ? "" : "ms");
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
        </h2>
        {#if unit}
            <div
                class="metric-badge"
                class:good={metric === 'CLS' || metric === 'INP'}
                class:time={metric !== 'CLS'}
            >
                {unit}
            </div>
        {/if}
    </div>
    <div class="legend-content">
        <div class="legend-item good">
            <div class="indicator"></div>
            <span class="legend-text"
                >{rangeNames.good} &lt; {metricData.range[0]}{unitLabel}</span
            >
        </div>
        <div class="legend-item average">
            <div class="indicator"></div>
            <span class="legend-text"
                >{rangeNames.medium}
                {metricData.range[0]} - {metricData.range[1]}{unitLabel}</span
            >
        </div>
        <div class="legend-item poor">
            <div class="indicator"></div>
            <span class="legend-text"
                >{rangeNames.poor} &gt; {metricData.range[1]}{unitLabel}</span
            >
        </div>
    </div>
</div>

<style>
    .legend-container {
        background: white;
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
        color: #2c3e50;
    }

    .metric-badge {
        background: #e9ecef;
        color: #6c757d;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .metric-badge.good {
        background: #d4edda;
        color: #155724;
    }

    .metric-badge.time {
        background: #d1ecf1;
        color: #0c5460;
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
        transition: all 0.2s ease;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
    }

    .legend-item:hover {
        background-color: #e9ecef;
        transform: translateY(-1px);
    }

    .indicator {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        flex-shrink: 0;
    }

    .legend-item.good .indicator {
        background-color: #28a745;
    }

    .legend-item.average .indicator {
        background-color: #ffc107;
    }

    .legend-item.poor .indicator {
        background-color: #dc3545;
    }

    .legend-text {
        font-size: 0.875rem;
        font-weight: 500;
        color: #2c3e50;
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

        .metric-header {
            flex-direction: column;
            align-items: flex-start;
        }

        h2 {
            font-size: 1.1rem;
        }

        .legend-content {
            flex-direction: column;
            gap: 8px;
        }

        .legend-item {
            padding: 8px 12px;
        }

        .legend-text {
            font-size: 0.8rem;
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

        .legend-item {
            padding: 6px 10px;
        }
    }
</style>
