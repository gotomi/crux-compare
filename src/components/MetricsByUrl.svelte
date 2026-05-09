<script>
    let { data } = $props();
    import Metric from '../components/Metric.svelte';
    import Legend from '../components/Legend.svelte';
    import { METRIC_KEYS } from '../lib/crux';

    const metricsByCategory = $derived(
        METRIC_KEYS.map((key) => ({
            key,
            entries: data?.metrics?.[key] ?? [],
        }))
    );
</script>

{#each metricsByCategory as { key, entries }}
    {#if entries.length > 0}
        <article>
            <Legend metric={key} />
            {#each entries as p}
                <Metric post={p} />
            {/each}
        </article>
    {/if}
{/each}
