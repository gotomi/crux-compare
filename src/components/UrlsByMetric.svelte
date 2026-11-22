<script>
let { data, trendWeeks = $bindable(1) } = $props();

import {
	CORE_WEB_VITALS,
	SOFTNAV_METRIC_KEYS,
	TABLE_METRIC_KEYS,
	trendOf,
} from "../lib/crux";

function imgIcon(url) {
	return (
		"https://www.google.com/s2/favicons?sz=16&domain_url=" +
		url.replace("https://", "")
	);
}

// soft-navigation columns appear only when the experimental data is present
const snKeys = $derived(
	SOFTNAV_METRIC_KEYS.filter((key) =>
		(data.metrics ?? []).some((item) => item[key]),
	),
);

const tableKeys = $derived([...TABLE_METRIC_KEYS, ...snKeys]);

function getMetric() {
	if (!data.metrics) return [];
	return data.metrics.map((item) => {
		const obj = [];
		obj.push({
			url: item.url,
			minimal: item.minimalGood,
		});
		tableKeys.forEach((metric) => {
			obj.push({
				p75: item[metric]?.p75,
				rank: item[metric]?.rank,
				trend: trendOf(
					item[metric]?.p75s,
					trendWeeks,
					data.params?.dates ?? [],
					metric,
				),
			});
		});

		return obj;
	});
}

const table = $derived([["url", ...tableKeys]].concat(getMetric()));

const tableHeading = $derived(table[0]);
</script>

<div class="metrics-container">
    <div class="desktop-view">
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        {#each tableHeading as cell}
                            <th
                                class:core-vital={CORE_WEB_VITALS.includes(cell)}
                                title={cell.endsWith("-SN")
                                    ? "experimental: includes soft navigations"
                                    : undefined}
                            >
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
                                                style={'width:' +
                                                    (cell.minimal ?? 0) +
                                                    '%'}
                                            ></div>
                                            <span class="bar-text"
                                                >{cell.minimal == null
                                                    ? "No CWV data"
                                                    : `${cell.minimal}%`}</span
                                            >
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
                        style={'width:' + (row[0].minimal ?? 0) + '%'}
                    ></div>
                    <span class="bar-text"
                        >{row[0].minimal == null
                            ? "No CWV data"
                            : `${row[0].minimal}% Good`}</span
                    >
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
        box-shadow: var(--shadow-md);
    }

    table {
        width: 100%;
        min-width: 800px;
        border-collapse: collapse;
        background: var(--surface);
    }

    thead th {
        background: var(--header-bg);
        color: var(--header-text);
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
        color: var(--chart-fair);
    }

    tbody tr {
        border-bottom: 1px solid var(--border);
        transition: background-color var(--transition);
    }

    tbody tr:hover {
        background-color: var(--surface-2);
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
        color: var(--text-strong);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }

    .performance-bar {
        position: relative;
        background-color: var(--chart-track);
        height: 8px;
        border-radius: 2px;
        overflow: hidden;
    }

    .bar-fill {
        background-color: var(--chart-good);
        height: 100%;
        transition: width 0.3s ease;
    }

    .bar-text {
        position: absolute;
        right: 8px;
        top: -18px;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
    }

    .icon {
        flex-shrink: 0;
    }

    .good {
        background: var(--success-soft);
        font-weight: 600;
    }

    .average {
        background: var(--warning-soft);
        font-weight: 600;
    }

    .poor {
        background: var(--chart-poor);
        color: var(--on-chart-poor);
        font-weight: 600;
    }

    .trend {
        display: inline-block;
        font-size: 0.7em;
        margin-left: 4px;
        padding: 1px 5px;
        border-radius: 3px;
        font-weight: 700;
        vertical-align: middle;
    }

    /* badge carries its own background so it reads on all three cell colors */
    .trend.better {
        background: var(--success-soft);
        color: var(--success);
    }

    .trend.worse {
        background: var(--danger-soft);
        color: var(--danger);
    }

    .mobile-view {
        display: none;
    }

    .metric-card {
        background: var(--surface);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: var(--shadow-md);
        transition:
            transform var(--transition),
            box-shadow var(--transition);
    }

    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .card-header .url-text {
        font-weight: 600;
        color: var(--text-strong);
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
        background: var(--surface-2);
        border-radius: 8px;
    }

    .metric-name {
        font-size: 12px;
        color: var(--text-muted);
        margin-bottom: 4px;
        text-align: center;
    }

    .metric-name.core-vital {
        font-weight: 800;
        color: var(--text-strong);
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
