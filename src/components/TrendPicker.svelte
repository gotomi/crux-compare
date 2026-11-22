<script>
import { periodRange } from "../lib/crux";

let { dates = [], weeks = $bindable(1) } = $props();

// comparison choices: every earlier week the history series covers, labeled by its period
const options = $derived.by(() => {
	const choices = [];
	for (let n = 1; n < dates.length; n++) {
		const range = periodRange(dates[dates.length - 1 - n]);
		choices.push({
			value: n,
			label: range || `${n} week${n === 1 ? "" : "s"} earlier`,
		});
	}
	return choices;
});
</script>

<div class="trend-picker">
    <label for="trend-weeks">Compare with</label>
    <select id="trend-weeks" bind:value={weeks}>
        {#each options as option}
            <option value={option.value}>{option.label}</option>
        {/each}
    </select>
</div>

<style>
    .trend-picker {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text-muted);
    }

    .trend-picker select {
        padding: 8px 12px;
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 3px;
        font-size: 14px;
        color: var(--text-strong);
        cursor: pointer;
        transition: border-color var(--transition);
    }

    .trend-picker select:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-soft);
    }
</style>
