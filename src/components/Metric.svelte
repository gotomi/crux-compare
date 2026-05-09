<script>
    let { post } = $props();
    import UrlWithIcon from "./UrlWithIcon.svelte";

    const rank = ['good', 'average', 'poor'];

    const rankMap = {
        good: " 🟢 ",
        average: " 🟠 ",
        poor: " 🔴 ",
    };
</script>

<div class="metric-card">
    <div class="metric-row">
        <div class="url-info">
            <UrlWithIcon url={post.url} />
        </div>

        {#if rankMap[post.rank]}
            <div class="metric-content">
                <div class="metric-value">
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
        }

        .histogram-bar {
            font-size: 0.7rem;
            min-width: 20px;
        }
    }
</style>
