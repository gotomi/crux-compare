<script>
let { entries } = $props();

import UrlWithIcon from "./UrlWithIcon.svelte";

// categorical palette — deliberately distinct from the good/average/poor
// traffic lights, since these distributions carry no quality judgement;
// related labels share a hue family
const LABEL_COLORS = {
	navigate: "#007bff",
	navigate_cache: "#6ea8fe",
	reload: "#17a2b8",
	restore: "#6c757d",
	back_forward: "#6f42c1",
	back_forward_cache: "#a98cdf",
	prerender: "#e83e8c",
	desktop: "#007bff",
	phone: "#17a2b8",
	tablet: "#6f42c1",
	image: "#fd7e14",
	text: "#007bff",
};

const FALLBACK_COLORS = [
	"#007bff",
	"#17a2b8",
	"#6f42c1",
	"#fd7e14",
	"#e83e8c",
	"#20c997",
	"#6c757d",
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
        background: white;
        padding: 4px 16px;
        margin-bottom: 8px;
        border-left: 3px solid #e9ecef;
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
        background: #e9ecef;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .segment {
        height: 100%;
        transition: filter 0.2s ease;
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
        color: #495057;
        white-space: nowrap;
    }

    .fraction-label strong {
        color: #2c3e50;
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
