<script>
let { post, metric, dates = [] } = $props();

import UrlWithIcon from "./UrlWithIcon.svelte";

const rank = ["good", "average", "poor"];

const rankMap = {
	good: " 🟢 ",
	average: " 🟠 ",
	poor: " 🔴 ",
};

const rankColors = {
	good: "#28a745",
	average: "#ffc107",
	poor: "#dc3545",
};

const unit = $derived(metric === "CLS" ? "" : "ms");

const W = 300;
const H = 44;
const PAD = 3;

function labelFor(index) {
	return dates[index] ?? `week ${index + 1}`;
}

function titleFor(index, value) {
	const rankValue = post.ranks?.[index];
	const formatted =
		typeof value === "number" ? `${value}${unit ? ` ${unit}` : ""}` : "no data";
	return `${labelFor(index)}: ${formatted} (${rankValue ?? "n/a"})`;
}

const trend = $derived.by(() => {
	const p75s = post.p75s ?? [];
	const points = p75s
		.map((value, index) => ({ value, index }))
		.filter((p) => typeof p.value === "number");

	if (points.length < 2) return null;

	const values = points.map((p) => p.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const span = max - min || Math.abs(max) * 0.1 || 1;
	const lo = min - span * 0.15;
	const hi = max + span * 0.15;

	const x = (index) => PAD + (index / (p75s.length - 1)) * (W - PAD * 2);
	const y = (value) => PAD + (1 - (value - lo) / (hi - lo)) * (H - PAD * 2);

	const segments = [];
	for (let i = 1; i < points.length; i++) {
		const a = points[i - 1];
		const b = points[i];
		segments.push({
			d: `M ${x(a.index)} ${y(a.value)} L ${x(b.index)} ${y(b.value)}`,
			color: rankColors[post.ranks?.[b.index]] ?? "#adb5bd",
			title: titleFor(b.index, b.value),
		});
	}

	return { segments, min, max };
});
</script>

<div class="metric-card">
    <div class="metric-row">
        <div class="url-info">
            <UrlWithIcon url={post.url} />
        </div>

        {#if rankMap[post.rank]}
            <div class="metric-content">
                <div class="metric-value {post.rank}">
                    <span class="value">{post.p75}</span>
                    <span class="rank-indicator">{rankMap[post.rank]}</span>
                </div>
                <div class="histogram-bars">
                    {#each post.histogram as item, index}
                        {#if item > 0}
                            <div
                                class="histogram-bar {rank[index]}"
                                style={"flex:" + item}
                                title={`${rank[index]}: ${item}%`}
                            >
                                <span class="bar-label">{item}%</span>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {:else}
            <div class="no-data">
                <span class="no-data-text">No data</span>
            </div>
        {/if}
    </div>

    {#if trend}
        <div class="trend">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`${metric} p75 trend for ${post.url}`}
            >
                {#each trend.segments as segment}
                    <path
                        d={segment.d}
                        stroke={segment.color}
                        stroke-width="2"
                        fill="none"
                        vector-effect="non-scaling-stroke"
                    >
                        <title>{segment.title}</title>
                    </path>
                {/each}
            </svg>
            <div class="rank-strip">
                {#each post.ranks ?? [] as rankValue, index}
                    <div
                        class="strip-cell {rankValue ?? 'empty'}"
                        title={titleFor(index, post.p75s?.[index])}
                    ></div>
                {/each}
            </div>
            <div class="scale-row">
                <span>min {trend.min}{unit ? ` ${unit}` : ""}</span>
                <span>{post.p75s?.length ?? 0} weeks</span>
                <span>max {trend.max}{unit ? ` ${unit}` : ""}</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .metric-card {
        background: white;
        border-radius: 0;
        padding: 4px 16px;
        margin-bottom: 8px;
        border-left: 3px solid #e9ecef;
        transition: all 0.2s ease;
    }

    .metric-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    .url-info {
        flex: 0 0 auto;
        min-width: 180px;
        max-width: 300px;
    }

    .metric-content {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        min-width: 0;
    }

    .metric-value {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 2px;
        font-weight: 600;
        font-size: 0.95rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .metric-value.good {
        background: rgba(40, 167, 69, 0.1);
        color: var(--success);
    }

    .metric-value.average {
        background: rgba(255, 193, 7, 0.1);
        color: var(--warning);
    }

    .metric-value.poor {
        background: rgba(220, 53, 69, 0.1);
        color: var(--danger);
    }

    .value {
        font-size: 1rem;
        font-weight: 700;
    }

    .rank-indicator {
        font-size: 0.9rem;
    }

    .histogram-bars {
        display: flex;
        height: 24px;
        border-radius: 2px;
        overflow: hidden;
        flex: 1;
        min-width: 120px;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .histogram-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.75rem;
        transition: all 0.2s ease;
        cursor: pointer;
        position: relative;
        min-width: 25px;
    }

    .histogram-bar:hover {
        filter: brightness(1.1);
        z-index: 1;
    }

    .histogram-bar.good {
        background: #28a745;
        color: #000;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
    }

    .histogram-bar.average {
        background: #ffc107;
        color: #000;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
    }

    .histogram-bar.poor {
        background: #dc3545;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .no-data {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        background: var(--light);
        border-radius: 2px;
        color: var(--gray);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .trend {
        margin-top: 6px;
        padding-left: 0;
    }

    .trend svg {
        display: block;
        width: 100%;
        height: 44px;
        background: #f8f9fa;
        border-radius: 2px;
    }

    .rank-strip {
        display: flex;
        gap: 1px;
        margin-top: 3px;
        height: 5px;
    }

    .strip-cell {
        flex: 1;
        border-radius: 1px;
    }

    .strip-cell.good {
        background: #28a745;
    }

    .strip-cell.average {
        background: #ffc107;
    }

    .strip-cell.poor {
        background: #dc3545;
    }

    .strip-cell.empty {
        background: #e9ecef;
    }

    .scale-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.65rem;
        color: #6c757d;
        margin-top: 2px;
    }

    /* Responsive styles */
    @media (max-width: 768px) {
        .metric-card {
            padding: 10px 12px;
            margin-bottom: 6px;
        }

        .metric-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
        }

        .url-info {
            min-width: auto;
            max-width: none;
        }

        .metric-content {
            justify-content: space-between;
        }

        .histogram-bars {
            height: 20px;
            min-width: 100px;
        }

        .metric-value {
            font-size: 0.875rem;
            padding: 4px 8px;
        }
    }

    @media (max-width: 480px) {
        .metric-card {
            padding: 8px 10px;
        }

        .metric-row {
            gap: 8px;
        }

        .metric-content {
            flex-direction: column;
            gap: 8px;
        }

        .histogram-bars {
            height: 18px;
            min-width: 80px;
            width: 100%;
        }

        .histogram-bar {
            font-size: 0.7rem;
            min-width: 20px;
        }
    }
</style>
