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
			color: rankColors[post.ranks?.[b.index]] ?? "#adb5bd",
			title: titleFor(b.index, b.value),
		});
	}

	// percent coordinates: the svg is stretched over the plot box (H is 1:1)
	const dots = points.map((p) => ({
		index: p.index,
		xp: (x(p.index) / W) * 100,
		yp: (y(p.value) / H) * 100,
		color: rankColors[post.ranks?.[p.index]] ?? "#adb5bd",
		rank: post.ranks?.[p.index] ?? "n/a",
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
                            stroke={segment.color}
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
                        class="dot"
                        class:selected={pinnedIndex === dot.index}
                        style={`left:${dot.xp}%;top:${dot.yp}%;--c:${dot.color}`}
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

    .plot {
        position: relative;
    }

    .trend svg {
        display: block;
        width: 100%;
        height: 44px;
        background: #f8f9fa;
        border-radius: 2px;
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
        background: var(--c, #adb5bd);
        box-shadow: 0 0 0 1.5px #fff;
        transition: inset 0.1s ease;
    }

    .dot:hover::after {
        inset: 2.5px;
    }

    .dot.selected::after {
        inset: 2px;
        box-shadow: 0 0 0 2px #2c3e50;
    }

    .point-tooltip {
        position: absolute;
        z-index: 5;
        transform: translate(-50%, -100%);
        margin-top: -10px;
        background: #2c3e50;
        color: #fff;
        border-radius: 4px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 1px;
        font-size: 0.75rem;
        line-height: 1.3;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
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
        color: #7ee2a0;
    }

    .pt-rank.average {
        color: #ffd66e;
    }

    .pt-rank.poor {
        color: #ff9ba6;
    }

    .pt-rank.n\/a {
        color: #dee2e6;
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
