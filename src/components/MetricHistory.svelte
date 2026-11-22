<script>
let { post, metric, dates = [] } = $props();

import UrlWithIcon from "./UrlWithIcon.svelte";

const rank = ["good", "average", "poor"];

const rankLabels = {
	good: "good",
	average: "average",
	poor: "poor",
};

const unit = $derived(metric.startsWith("CLS") ? "" : "ms");

let hoverIndex = $state(null);
let pinnedIndex = $state(null);

function togglePin(index) {
	pinnedIndex = pinnedIndex === index ? null : index;
}

const W = 300;
const H = 44;
const PAD = 3;

function labelFor(index) {
	return dates[index] ?? `week ${index + 1}`;
}

// "2026-04-11" -> "11/04/26"
function shortDate(iso) {
	const [year, month, day] = iso.split("-");
	return `${day}/${month}/${year.slice(2)}`;
}

const trendRange = $derived.by(() => {
	const first = dates[0];
	const last = dates.at(-1);
	if (!first || !last) return `${post.p75s?.length ?? 0} weeks`;
	return `${shortDate(first)} – ${shortDate(last)}`;
});

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
			rank: post.ranks?.[b.index] ?? "unknown",
			title: titleFor(b.index, b.value),
		});
	}

	// percent coordinates: the svg is stretched over the plot box (H is 1:1)
	const dots = points.map((p) => ({
		index: p.index,
		xp: (x(p.index) / W) * 100,
		yp: (y(p.value) / H) * 100,
		rank: post.ranks?.[p.index] ?? "unknown",
		value: p.value,
		label: labelFor(p.index),
	}));

	return { segments, dots, min, max };
});

const activeDot = $derived.by(() => {
	const target = hoverIndex ?? pinnedIndex;
	if (target === null) return null;
	return trend?.dots?.find((d) => d.index === target) ?? null;
});
</script>

<div class="metric-card">
    <div class="metric-row">
        <div class="url-info">
            <UrlWithIcon url={post.url} />
        </div>

        {#if rankLabels[post.rank]}
            <div class="metric-value {post.rank}">
                <span class="value">{post.p75}</span>
                <span class="rank-indicator {post.rank}"
                    ><span class="sr-only">{rankLabels[post.rank]}</span></span
                >
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
        {:else}
            <div class="no-data">
                <span class="no-data-text">No data</span>
            </div>
        {/if}
    </div>

    {#if trend}
        <div class="trend">
            <div class="plot">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`${metric} p75 trend for ${post.url}`}
                >
                    {#each trend.segments as segment}
                        <path
                            d={segment.d}
                            class={segment.rank}
                            stroke-width="2"
                            fill="none"
                            vector-effect="non-scaling-stroke"
                        >
                            <title>{segment.title}</title>
                        </path>
                    {/each}
                </svg>
                {#each trend.dots as dot (dot.index)}
                    <button
                        type="button"
                        class="dot {dot.rank}"
                        class:selected={pinnedIndex === dot.index}
                        style={`left:${dot.xp}%;top:${dot.yp}%`}
                        aria-label={`${dot.label}: ${dot.value}${unit ? ` ${unit}` : ""}, ${dot.rank}`}
                        onmouseenter={() => (hoverIndex = dot.index)}
                        onfocus={() => (hoverIndex = dot.index)}
                        onmouseleave={() => (hoverIndex = null)}
                        onblur={() => (hoverIndex = null)}
                        onclick={() => togglePin(dot.index)}
                        onkeydown={(e) => {
                            if (e.key === "Escape") pinnedIndex = null;
                        }}
                    ></button>
                {/each}
                {#if activeDot}
                    <div
                        class="point-tooltip"
                        style={`left:${Math.min(Math.max(activeDot.xp, 15), 85)}%`}
                    >
                        <span class="pt-date">{activeDot.label}</span>
                        <span class="pt-value"
                            >{activeDot.value}{unit ? ` ${unit}` : ""}</span
                        >
                        <span class="pt-rank {activeDot.rank}"
                            >{activeDot.rank}</span
                        >
                    </div>
                {/if}
            </div>
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
                <span>{trendRange}</span>
                <span>max {trend.max}{unit ? ` ${unit}` : ""}</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .metric-card {
        background: var(--surface);
        border-radius: 0;
        padding: 4px 16px;
        margin-bottom: 8px;
        border-left: 3px solid var(--border);
        transition: all var(--transition);
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
        background: var(--success-soft);
        color: var(--success);
    }

    .metric-value.average {
        background: var(--warning-soft);
        color: var(--warning);
    }

    .metric-value.poor {
        background: var(--danger-soft);
        color: var(--danger);
    }

    .value {
        font-size: 1rem;
        font-weight: 700;
    }

    .rank-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .rank-indicator.good {
        background: var(--chart-good);
    }

    .rank-indicator.average {
        background: var(--chart-fair);
    }

    .rank-indicator.poor {
        background: var(--chart-poor);
    }

    .sr-only {
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
        font-weight: 600;
        font-size: 0.75rem;
        transition: all var(--transition);
        cursor: pointer;
        position: relative;
        min-width: 25px;
    }

    .histogram-bar:hover {
        filter: brightness(1.1);
        z-index: 1;
    }

    .histogram-bar.good {
        background: var(--chart-good);
        color: var(--on-chart-good);
    }

    .histogram-bar.average {
        background: var(--chart-fair);
        color: var(--on-chart-fair);
    }

    .histogram-bar.poor {
        background: var(--chart-poor);
        color: var(--on-chart-poor);
    }

    .no-data {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        background: var(--surface-2);
        border-radius: 2px;
        color: var(--text-muted);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .trend {
        margin-top: 6px;
        padding-left: 0;
    }

    .plot {
        position: relative;
    }

    .trend svg {
        display: block;
        width: 100%;
        height: 44px;
        background: var(--surface-2);
        border-radius: 2px;
    }

    /* SVG strokes are set via classes so they follow the theme tokens */
    .trend svg path.good {
        stroke: var(--chart-good);
    }

    .trend svg path.average {
        stroke: var(--chart-fair);
    }

    .trend svg path.poor {
        stroke: var(--chart-poor);
    }

    .trend svg path.unknown {
        stroke: var(--border-strong);
    }

    .dot {
        position: absolute;
        width: 15px;
        height: 15px;
        transform: translate(-50%, -50%);
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        z-index: 2;
    }

    .dot::after {
        content: "";
        position: absolute;
        inset: 4px;
        border-radius: 50%;
        background: var(--border-strong);
        box-shadow: 0 0 0 1.5px var(--surface);
        transition: inset 0.1s ease;
    }

    .dot.good::after {
        background: var(--chart-good);
    }

    .dot.average::after {
        background: var(--chart-fair);
    }

    .dot.poor::after {
        background: var(--chart-poor);
    }

    .dot:hover::after {
        inset: 2.5px;
    }

    .dot.selected::after {
        inset: 2px;
        box-shadow: 0 0 0 2px var(--text-strong);
    }

    .point-tooltip {
        position: absolute;
        z-index: 5;
        transform: translate(-50%, -100%);
        margin-top: -10px;
        background: var(--tooltip-bg);
        color: var(--tooltip-text);
        border-radius: 4px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 1px;
        font-size: 0.75rem;
        line-height: 1.3;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: var(--shadow-md);
    }

    .pt-date {
        opacity: 0.75;
        font-size: 0.65rem;
    }

    .pt-value {
        font-weight: 700;
        font-size: 0.85rem;
    }

    .pt-rank {
        text-transform: capitalize;
        font-size: 0.7rem;
    }

    .pt-rank.good {
        color: var(--tooltip-good);
    }

    .pt-rank.average {
        color: var(--tooltip-fair);
    }

    .pt-rank.poor {
        color: var(--tooltip-poor);
    }

    .pt-rank.n\/a {
        color: var(--tooltip-muted);
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
        background: var(--chart-good);
    }

    .strip-cell.average {
        background: var(--chart-fair);
    }

    .strip-cell.poor {
        background: var(--chart-poor);
    }

    .strip-cell.empty {
        background: var(--border);
    }

    .scale-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.65rem;
        color: var(--text-muted);
        margin-top: 2px;
    }

    /* Responsive styles */
    @media (max-width: 768px) {
        .metric-card {
            padding: 10px 12px;
            margin-bottom: 6px;
        }

        /* row 1: domain + p75, row 2: full-width histogram */
        .url-info {
            min-width: auto;
            max-width: none;
            flex: 1;
        }

        .histogram-bars {
            flex-basis: 100%;
            height: 20px;
        }

        .metric-value {
            font-size: 0.875rem;
            padding: 4px 8px;
        }

        .dot {
            width: 19px;
            height: 19px;
        }

        .dot::after {
            inset: 6px;
        }

        .dot.selected::after {
            inset: 4px;
        }
    }

    @media (max-width: 480px) {
        .metric-card {
            padding: 8px 10px;
        }

        .metric-row {
            gap: 8px;
        }

        .histogram-bars {
            height: 18px;
        }

        .histogram-bar {
            font-size: 0.7rem;
            min-width: 20px;
        }
    }
</style>
