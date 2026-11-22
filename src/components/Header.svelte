<script>
const { data } = $props();

const params = $derived(data?.params);
const urlType = $derived(params?.url ? "URL" : "ORIGIN");

const firstDay = $derived.by(() => {
	if (!params?.collectionPeriod?.firstDate) return "";
	const { year, month, day } = params.collectionPeriod.firstDate;
	return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
		dateStyle: "short",
	});
});

const lastDay = $derived.by(() => {
	if (!params?.collectionPeriod?.lastDate) return "";
	const { year, month, day } = params.collectionPeriod.lastDate;
	return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
		dateStyle: "short",
	});
});

const deviceLabel = $derived(params?.formFactor || "ALL DEVICES");
const weeks = $derived(params?.history ? params?.weeks : 0);
</script>

<p>
    <strong>{deviceLabel}</strong>
    <!-- globe -->
    <svg
        class="icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
    </svg>
    <strong>{urlType}</strong>
    <!-- calendar -->
    <svg
        class="icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
    {firstDay} - {lastDay}{#if weeks}&nbsp;·
        &nbsp;{weeks}-week trend{/if}
</p>

<style>
    .icon {
        vertical-align: -2px;
        margin: 0 2px;
    }
</style>
