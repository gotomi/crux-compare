<script>
let { metrics } = $props();

import UrlWithIcon from "./UrlWithIcon.svelte";

const PHASES = [
	{ key: "LCP-TTFB", name: "Time to first byte" },
	{ key: "LCP-LD", name: "Load delay" },
	{ key: "LCP-LDur", name: "Load duration" },
	{ key: "LCP-RD", name: "Render delay" },
];

const rows = $derived.by(() => {
	const byUrl = new Map();
	for (const phase of PHASES) {
		for (const entry of metrics?.[phase.key] ?? []) {
			let row = byUrl.get(entry.url);
			if (!row) {
				row = { url: entry.url, values: {} };
				byUrl.set(entry.url, row);
			}
			row.values[phase.key] = entry.p75;
		}
	}
	return [...byUrl.values()];
});

// bars scale within a phase across URLs, so rows compare like-for-like
const maxOf = $derived.by(() => {
	const max = {};
	for (const phase of PHASES) {
		max[phase.key] = Math.max(
			0,
			...rows.map((row) => row.values[phase.key] ?? 0),
		);
	}
	return max;
});
</script>

{#each rows as row}
    <div class="phase-row">
        <div class="url-info">
            <UrlWithIcon url={row.url} />
        </div>
        <div class="phase-grid">
            {#each PHASES as phase}
                {@const value = row.values[phase.key]}
                {@const max = maxOf[phase.key] ?? 0}
                <div class="phase-cell" class:missing={typeof value !== "number"}>
                    <span class="phase-name">{phase.name}</span>
                    {#if typeof value === "number"}
                        <div
                            class="phase-track"
                            title={`${phase.name}: ${value} ms`}
                        >
                            <div
                                class="phase-bar"
                                style={`width:${max > 0 ? (value / max) * 100 : 0}%`}
                            ></div>
                        </div>
                        <span class="phase-value"
                            >{value}<small> ms</small></span
                        >
                    {:else}
                        <span class="phase-track"></span>
                        <span class="phase-value">—</span>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/each}

<style>
    .phase-row {
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

    .phase-grid {
        flex: 1;
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px 16px;
    }

    .phase-cell {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
    }

    .phase-name {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #6c757d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .phase-track {
        display: block;
        height: 8px;
        border-radius: 2px;
        background: #e9ecef;
        overflow: hidden;
    }

    .phase-bar {
        height: 100%;
        background: #007bff;
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    .phase-value {
        font-size: 0.85rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .phase-value small {
        font-weight: 400;
        color: #6c757d;
    }

    .missing .phase-value {
        color: #adb5bd;
        font-weight: 400;
    }

    @media (max-width: 768px) {
        .phase-row {
            flex-direction: column;
            gap: 8px;
            padding: 10px 12px;
        }

        .url-info {
            min-width: auto;
            max-width: none;
            padding-top: 0;
        }

        .phase-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 480px) {
        .phase-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
