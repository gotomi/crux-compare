<script>
let { data } = $props();

import { CORE_WEB_VITALS, TABLE_METRIC_KEYS } from "../lib/crux";

function imgIcon(url) {
	return (
		"https://www.google.com/s2/favicons?sz=16&domain_url=" +
		url.replace("https://", "")
	);
}

const TREND_WEEKS = 4;
const TREND_THRESHOLD = 0.02;

// p75 change vs TREND_WEEKS earlier; lower is better for every metric
function trendOf(p75s) {
	if (!Array.isArray(p75s) || p75s.length <= TREND_WEEKS) return null;

	let lastIndex = -1;
	for (let i = p75s.length - 1; i >= 0; i--) {
		if (typeof p75s[i] === "number") {
			lastIndex = i;
			break;
		}
	}

	let prevIndex = lastIndex - TREND_WEEKS;
	if (lastIndex < 0 || prevIndex < 0) return null;
	while (prevIndex >= 0 && typeof p75s[prevIndex] !== "number") {
		prevIndex--;
	}
	if (prevIndex < 0) return null;

	const last = p75s[lastIndex];
	const prev = p75s[prevIndex];
	const delta = prev === 0 ? 0 : (last - prev) / prev;
	if (!Number.isFinite(delta) || Math.abs(delta) < TREND_THRESHOLD) {
		return null;
	}

	const percent = Math.abs(Math.round(delta * 100));
	const weeks = `vs ${TREND_WEEKS} week${TREND_WEEKS === 1 ? "" : "s"} earlier`;
	return {
		dir: delta < 0 ? "better" : "worse",
		label: `${delta < 0 ? "▼" : "▲"}${percent}%`,
		title: `${percent}% ${delta < 0 ? "better" : "worse"} ${weeks}`,
	};
}

function getMetric() {
	if (!data.metrics) return [];
	return data.metrics.map((item) => {
		const obj = [];
		obj.push({
			url: item.url,
			minimal: item.minimalGood,
		});
		TABLE_METRIC_KEYS.forEach((metric) => {
			obj.push({
				p75: item[metric]?.p75,
				rank: item[metric]?.rank,
				trend: trendOf(item[metric]?.p75s),
			});
		});

		return obj;
	});
}

const table = $derived([["url", ...TABLE_METRIC_KEYS]].concat(getMetric()));

const tableHeading = $derived(table[0]);
</script>

<div class="metrics-container">
    <div class="desktop-view">
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        {#each tableHeading as cell}
                            <th class:core-vital={CORE_WEB_VITALS.includes(cell)}>
                                {cell === 'url'
                                    ? data.params.origin
                                        ? 'Origin'
                                        : 'URL'
                                    : cell}
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each table.slice(1) as row}
                        <tr>
                            {#each row as cell}
                                {#if "p75" in cell}
                                    <td class={cell.rank}>
                                        {cell.p75}{#if cell.trend}
                                            <span
                                                class="trend {cell.trend.dir}"
                                                title={cell.trend.title}
                                            >{cell.trend.label}</span
                                            >{/if}
                                    </td>
                                {:else}
                                    <td class="url-cell">
                                        <div class="url-info">
                                            <img
                                                src={imgIcon(cell.url)}
                                                class="icon"
                                                width="16"
                                                height="16"
                                                alt="Favicon"
                                            />
                                            <span
                                                title={cell.url}
                                                class="url-text"
                                            >{cell.url}</span>
                                        </div>
                                        <div class="performance-bar">
                                            <div
                                                class="bar-fill"
                                                style={'width:' + cell.minimal + '%'}
                                            ></div>
                                            <span class="bar-text">{cell.minimal}%</span>
                                        </div>
                                    </td>
                                {/if}
                            {/each}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

    <div class="mobile-view">
        {#each table.slice(1) as row}
            <div class="metric-card">
                <div class="card-header">
                    <img
                        src={imgIcon(row[0].url)}
                        class="icon"
                        width="20"
                        height="20"
                        alt="Favicon"
                    />
                    <span class="url-text" title={row[0].url}>{row[0].url}</span>
                </div>
                <div class="performance-bar">
                    <div
                        class="bar-fill"
                        style={'width:' + row[0].minimal + '%'}
                    ></div>
                    <span class="bar-text">{row[0].minimal}% Good</span>
                </div>
                <div class="metrics-grid">
                    {#each row.slice(1) as metric, metricIndex}
                        {@const metricKey = tableHeading[metricIndex + 1]}
                        <div class="metric-item">
                            <span
                                class="metric-name"
                                class:core-vital={CORE_WEB_VITALS.includes(metricKey)}
                            >{metricKey}</span>
                            <span class="metric-value {metric.rank}"
                                >{metric.p75}{#if metric.trend}
                                    <span
                                        class="trend {metric.trend.dir}"
                                        title={metric.trend.title}
                                    >{metric.trend.label}</span
                                    >{/if}</span
                            >
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .metrics-container {
        max-width: 100%;
        margin: 20px 0;
    }

    .desktop-view {
        display: block;
    }

    .table-wrapper {
        overflow-x: auto;
        border-radius: 3px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    table {
        width: 100%;
        min-width: 800px;
        border-collapse: collapse;
        background: white;
    }

    thead th {
        background: #2c3e50;
        color: white;
        font-weight: 600;
        padding: 16px 12px;
        text-align: left;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    thead th.core-vital {
        font-weight: 800;
        font-size: 1.05em;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #ffc107;
    }

    tbody tr {
        border-bottom: 1px solid #e9ecef;
        transition: background-color 0.2s ease;
    }

    tbody tr:hover {
        background-color: #f8f9fa;
    }

    td {
        padding: 12px;
        border: none;
        vertical-align: middle;
    }

    .url-cell {
        min-width: 200px;
    }

    .url-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .url-text {
        font-weight: 500;
        color: #2c3e50;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }

    .performance-bar {
        position: relative;
        background-color: #e9ecef;
        height: 8px;
        border-radius: 2px;
        overflow: hidden;
    }

    .bar-fill {
        background-color: #28a745;
        height: 100%;
        transition: width 0.3s ease;
    }

    .bar-text {
        position: absolute;
        right: 8px;
        top: -18px;
        font-size: 12px;
        font-weight: 600;
        color: #6c757d;
    }

    .icon {
        flex-shrink: 0;
    }

    .good {
        background: #2ead4b56;
        font-weight: 600;
    }

    .average {
        background: #ffc10790;
        font-weight: 600;
    }

    .poor {
        background: #dc3545;
        color: #fff;
        font-weight: 600;
    }

    .trend {
        font-size: 0.75em;
        margin-left: 4px;
        opacity: 0.85;
    }

    .mobile-view {
        display: none;
    }

    .metric-card {
        background: white;
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .card-header .url-text {
        font-weight: 600;
        color: #2c3e50;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
        margin-top: 16px;
    }

    .metric-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .metric-name {
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 4px;
        text-align: center;
    }

    .metric-name.core-vital {
        font-weight: 800;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .metric-value {
        font-size: 14px;
        font-weight: 600;
    }

    @media (max-width: 768px) {
        .desktop-view {
            display: none;
        }

        .mobile-view {
            display: block;
        }

        .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 480px) {
        .metrics-grid {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }
</style>
