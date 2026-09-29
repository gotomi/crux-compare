<script>
import FractionCard from "./FractionCard.svelte";
import LcpPhases from "./LcpPhases.svelte";

let { data } = $props();

const FRACTION_SECTIONS = [
	{
		key: "NAV_TYPES",
		name: "Navigation Types",
		description:
			"How page loads start: regular navigations, reloads, back/forward (including back/forward cache) and prerendered loads.",
	},
	{
		key: "FORM_FACTORS",
		name: "Form Factors",
		description: "Share of page loads per device class.",
		hint: "Only reported when the device filter is set to ALL_FORM_FACTORS.",
	},
	{
		key: "LCP-RES",
		name: "LCP Resource Type",
		description:
			"Whether the largest contentful paint element is an image or text.",
	},
];

const SUBPART_KEYS = ["LCP-TTFB", "LCP-LD", "LCP-LDur", "LCP-RD"];

const sections = $derived(
	FRACTION_SECTIONS.map((section) => ({
		...section,
		entries: data?.metrics?.[section.key] ?? null,
	})),
);

const hasSubparts = $derived(
	SUBPART_KEYS.some((key) => (data?.metrics?.[key]?.length ?? 0) > 0),
);
</script>

{#each sections as section}
    <article>
        <div class="section-header">
            <h2>{section.name}</h2>
            <span class="badge">%</span>
        </div>
        {#if section.entries}
            <p class="section-description">{section.description}</p>
            <FractionCard entries={section.entries} />
        {:else}
            <p class="section-hint">
                {section.hint ?? "No data for these URLs."}
            </p>
        {/if}
    </article>
{/each}

{#if hasSubparts}
    <article>
        <div class="section-header">
            <h2>LCP Image Phases</h2>
            <span class="badge">p75 · ms</span>
        </div>
        <p class="section-description">
            For page loads whose LCP element is an image: time to first byte,
            resource load delay, resource load duration and element render
            delay. Each phase is an independent p75, so the values do not sum
            to the overall LCP p75.
        </p>
        <LcpPhases metrics={data?.metrics} />
    </article>
{/if}

<style>
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        margin-bottom: 6px;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .badge {
        background: #e9ecef;
        color: #6c757d;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        white-space: nowrap;
    }

    .section-description {
        margin: 0 0 14px;
        padding: 0 16px;
        font-size: 0.875rem;
        color: #6c757d;
    }

    .section-hint {
        margin: 0;
        padding: 10px 16px;
        font-size: 0.875rem;
        font-style: italic;
        color: #adb5bd;
    }

    @media (max-width: 768px) {
        .section-header {
            padding: 0 12px;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
        }

        h2 {
            font-size: 1.1rem;
        }

        .section-description {
            padding: 0 12px;
            font-size: 0.8rem;
        }

        .section-hint {
            padding: 8px 12px;
        }
    }
</style>
