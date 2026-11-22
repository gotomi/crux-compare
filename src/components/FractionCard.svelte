<script>
let { entries } = $props();

import UrlWithIcon from "./UrlWithIcon.svelte";

// categorical palette — deliberately distinct from the good/average/poor
// traffic lights, since these distributions carry no quality judgement;
// related labels share a hue family. Colors come from the --cat-* theme
// tokens (see global.css) so segments adapt to light/dark.
const LABEL_COLORS = {
	navigate: "var(--cat-blue)",
	navigate_cache: "var(--cat-blue-soft)",
	reload: "var(--cat-cyan)",
	restore: "var(--cat-gray)",
	back_forward: "var(--cat-purple)",
	back_forward_cache: "var(--cat-purple-soft)",
	prerender: "var(--cat-pink)",
	desktop: "var(--cat-blue)",
	phone: "var(--cat-cyan)",
	tablet: "var(--cat-purple)",
	image: "var(--cat-orange)",
	text: "var(--cat-blue)",
};

const FALLBACK_COLORS = [
	"var(--cat-blue)",
	"var(--cat-cyan)",
	"var(--cat-purple)",
	"var(--cat-orange)",
	"var(--cat-pink)",
	"var(--cat-teal)",
	"var(--cat-gray)",
];

const LABEL_TITLES = {
	navigate: "Regular navigation (link, address bar, bookmark)",
	navigate_cache: "Regular navigation, page loaded from cache",
	reload: "Page reload",
	restore: "Browser session restore",
	back_forward: "History traversal (back/forward buttons)",
	back_forward_cache: "History traversal served from back/forward cache",
	prerender: "Prerendered navigation (e.g. Speculation Rules)",
	desktop: "Desktop devices",
	phone: "Phones",
	tablet: "Tablets",
	image: "LCP element is an image (incl. video first frames)",
	text: "LCP element is text",
};

function colorFor(label, index) {
	return LABEL_COLORS[label] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function formatPercent(value) {
	if (value >= 10) return String(Math.round(value));
	if (value >= 1) return String(Math.round(value * 10) / 10);
	return String(Math.round(value * 100) / 100);
}

const rows = $derived(
	(entries ?? []).map((entry) => ({
		url: entry.url,
		segments: Object.entries(entry.fractions ?? {})
			.map(([label, value]) => ({ label, value }))
			.filter(({ value }) => value > 0)
			.sort((a, b) => b.value - a.value)
			.map(({ label, value }, index) => ({
				label,
				value,
				percent: formatPercent(value),
				color: colorFor(label, index),
			})),
	})),
);
</script>

{#each rows as row}
    <div class="fraction-row">
        <div class="url-info">
            <UrlWithIcon url={row.url} />
        </div>
        <div class="fraction-content">
            <div
                class="fraction-bar"
                role="img"
                aria-label={row.segments
                    .map((s) => `${s.label} ${s.percent}%`)
                    .join(", ")}
            >
                {#each row.segments as segment}
                    <span
                        class="segment"
                        style={`width:${segment.value}%;background:${segment.color}`}
                        title={`${segment.label}: ${segment.percent}%`}
                    ></span>
                {/each}
            </div>
            <div class="fraction-labels">
                {#each row.segments as segment}
                    <span
                        class="fraction-label"
                        title={LABEL_TITLES[segment.label] ?? segment.label}
                    >
                        <i
                            class="dot"
                            style={`background:${segment.color}`}
                            aria-hidden="true"
                        ></i>
                        {segment.label}
                        <strong>{segment.percent}%</strong>
                    </span>
                {/each}
            </div>
        </div>
    </div>
{/each}

<style>
    .fraction-row {
        background: var(--surface);
        padding: 4px 16px;
        margin-bottom: 8px;
        border-left: 3px solid var(--border);
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .url-info {
        flex: 0 0 auto;
        min-width: 180px;
        max-width: 300px;
    }

    .fraction-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .fraction-bar {
        display: flex;
        height: 22px;
        border-radius: 2px;
        overflow: hidden;
        background: var(--chart-track);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .segment {
        height: 100%;
        transition: filter var(--transition);
    }

    .segment:hover {
        filter: brightness(1.1);
    }

    .fraction-labels {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
    }

    .fraction-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: var(--text-muted);
        white-space: nowrap;
    }

    .fraction-label strong {
        color: var(--text-strong);
    }

    .dot {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        .fraction-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 10px 12px;
        }

        .url-info {
            min-width: auto;
            max-width: none;
        }
    }
</style>
