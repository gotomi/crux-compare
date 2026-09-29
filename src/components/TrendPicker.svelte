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
        color: #495057;
    }

    .trend-picker select {
        padding: 8px 12px;
        background: #fff;
        border: 2px solid #e9ecef;
        border-radius: 3px;
        font-size: 14px;
        color: #2c3e50;
        cursor: pointer;
        transition: border-color 0.2s ease;
    }

    .trend-picker select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
</style>
