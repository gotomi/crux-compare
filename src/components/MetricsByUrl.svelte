<script>
let { data } = $props();

import Legend from "../components/Legend.svelte";
import Metric from "../components/Metric.svelte";
import MetricHistory from "../components/MetricHistory.svelte";
import { METRIC_KEYS } from "../lib/crux";

const isHistory = $derived((data?.params?.dates?.length ?? 0) > 0);
const dates = $derived(data?.params?.dates ?? []);

const metricsByCategory = $derived(
	METRIC_KEYS.map((key) => ({
		key,
		entries: data?.metrics?.[key] ?? [],
	})),
);
</script>

{#each metricsByCategory as { key, entries }}
    {#if entries.length > 0}
        <article>
            <Legend metric={key} />
            {#each entries as p}
                {#if isHistory}
                    <MetricHistory post={p} metric={key} {dates} />
                {:else}
                    <Metric post={p} />
                {/if}
            {/each}
        </article>
    {/if}
{/each}
