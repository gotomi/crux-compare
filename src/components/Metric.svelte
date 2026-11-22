<script>
let { post } = $props();

import UrlWithIcon from "./UrlWithIcon.svelte";

const rank = ["good", "average", "poor"];

const rankLabels = {
	good: "good",
	average: "average",
	poor: "poor",
};
</script>

<div class="metric-card">
    <div class="metric-row">
        <div class="url-info">
            <UrlWithIcon url={post.url} />
        </div>

        {#if rankLabels[post.rank]}
            <div class="metric-value">
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

    .metric-card.good {
        border-left-color: var(--success);
    }

    .metric-card.average {
        border-left-color: var(--warning);
    }

    .metric-card.poor {
        border-left-color: var(--danger);
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
