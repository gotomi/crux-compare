<script>
let { metrics } = $props();

import UrlWithIcon from "./UrlWithIcon.svelte";

const ADS = [
	{ key: "AD-COUNT", name: "Ad count", unit: "" },
	{ key: "AD-DENSITY", name: "Ad density", unit: "%" },
	{ key: "AD-CPU", name: "Ad CPU", unit: " ms" },
	{ key: "AD-KB", name: "Ad weight", unit: " KB" },
];

const rows = $derived.by(() => {
	const byUrl = new Map();
	for (const ad of ADS) {
		for (const entry of metrics?.[ad.key] ?? []) {
			let row = byUrl.get(entry.url);
			if (!row) {
				row = { url: entry.url, values: {} };
				byUrl.set(entry.url, row);
			}
			row.values[ad.key] = entry.p75;
		}
	}
	return [...byUrl.values()];
});

// bars scale within a metric across URLs, so rows compare like-for-like
const maxOf = $derived.by(() => {
	const max = {};
	for (const ad of ADS) {
		max[ad.key] = Math.max(0, ...rows.map((row) => row.values[ad.key] ?? 0));
	}
	return max;
});
</script>

{#each rows as row}
    <div class="ad-row">
        <div class="url-info">
            <UrlWithIcon url={row.url} />
        </div>
        <div class="ad-grid">
            {#each ADS as ad}
                {@const value = row.values[ad.key]}
                {@const max = maxOf[ad.key] ?? 0}
                <div class="ad-cell" class:missing={typeof value !== "number"}>
                    <span class="ad-name">{ad.name}</span>
                    {#if typeof value === "number"}
                        <div
                            class="ad-track"
                            title={`${ad.name}: ${value}${ad.unit}`}
                        >
                            <div
                                class="ad-bar"
                                style={`width:${max > 0 ? (value / max) * 100 : 0}%`}
                            ></div>
                        </div>
                        <span class="ad-value"
                            >{value}<small>{ad.unit}</small></span
                        >
                    {:else}
                        <span class="ad-track"></span>
                        <span class="ad-value">—</span>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/each}

<style>
    .ad-row {
        background: white;
        padding: 8px 16px;
        margin-bottom: 8px;
        border-left: 3px solid #e9ecef;
        display: flex;
        align-items: flex-start;
        gap: 16px;
    }

    .url-info {
        flex: 0 0 auto;
        min-width: 180px;
        max-width: 300px;
        padding-top: 4px;
    }

    .ad-grid {
        flex: 1;
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px 16px;
    }

    .ad-cell {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
    }

    .ad-name {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #6c757d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ad-track {
        display: block;
        height: 8px;
        border-radius: 2px;
        background: #e9ecef;
        overflow: hidden;
    }

    .ad-bar {
        height: 100%;
        background: #6f42c1;
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    .ad-value {
        font-size: 0.85rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .ad-value small {
        font-weight: 400;
        color: #6c757d;
    }

    .missing .ad-value {
        color: #adb5bd;
        font-weight: 400;
    }

    @media (max-width: 768px) {
        .ad-row {
            flex-direction: column;
            gap: 8px;
            padding: 10px 12px;
        }

        .url-info {
            min-width: auto;
            max-width: none;
            padding-top: 0;
        }

        .ad-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 480px) {
        .ad-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
