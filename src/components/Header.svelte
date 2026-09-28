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
    🌐 <strong>{urlType}</strong> 📅 {firstDay} - {lastDay}{#if weeks}&nbsp;·
        &nbsp;{weeks}-week trend{/if}
</p>
