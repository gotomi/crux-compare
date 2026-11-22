<script>
import { onMount } from "svelte";
import { validateUrls } from "../lib/crux";
import AdvancedMetrics from "./AdvancedMetrics.svelte";
import Header from "./Header.svelte";
import MetricsByUrl from "./MetricsByUrl.svelte";
import TrendPicker from "./TrendPicker.svelte";
import UiInput from "./UiInput.svelte";
import UrlsByMetric from "./UrlsByMetric.svelte";

const formFactorValues = ["ALL_FORM_FACTORS", "PHONE", "DESKTOP", "TABLET"];

let initialData = $state({
	url: [""],
	checkOrigin: true,
	formFactor: "PHONE",
	history: false,
	experimental: false,
});

let promise = $state(Promise.reject(new Error("")));
let errors = $state({});
let touched = $state({});
let view = $state("overview");
let trendWeeks = $state(1);

function hasAdvanced(content) {
	return (
		!!content?.advanced?.metrics &&
		Object.keys(content.advanced.metrics).length > 0
	);
}

function activeView(content) {
	return view === "advanced" && hasAdvanced(content) ? "advanced" : "overview";
}

function setView(next) {
	view = next;
	const url = new URL(location.href);
	if (next === "advanced") {
		url.searchParams.set("view", "advanced");
	} else {
		url.searchParams.delete("view");
	}
	history.replaceState(null, "", url);
}

function addItem(e) {
	e.preventDefault();
	const len = initialData.url.length;
	initialData.url[len] = "";
	touched[`url_${len}`] = false;
}

function removeItem(i) {
	return () => {
		initialData.url.splice(i, 1);
		initialData.url = [...initialData.url];

		const newErrors = { ...errors };
		const newTouched = { ...touched };
		delete newErrors[`url_${i}`];
		delete newTouched[`url_${i}`];
		errors = newErrors;
		touched = newTouched;
	};
}

function handleUrlChange(index, value) {
	initialData.url[index] = value;
	touched[`url_${index}`] = true;
}

onMount(async () => {
	const data = new URL(location.href).searchParams;
	const url = data.getAll("url");
	const checkOrigin = !!data.get("checkOrigin");
	const formFactor = data.get("formFactor");
	const history = !!data.get("history");
	const experimental = !!data.get("experimental");

	if (data.get("view") === "advanced") {
		view = "advanced";
	}

	if (url.length) {
		initialData.url = url;
		initialData.checkOrigin = checkOrigin;
		initialData.formFactor = formFactor;
		initialData.history = history;
		initialData.experimental = experimental;
		promise = getCrux(data);
	}
});

async function getCrux(data) {
	const res = await fetch("/api/getCrux", {
		method: "POST",
		headers: {
			Accept: "application/json",
		},
		body: data,
	});

	const text = await res.text();
	let content = null;
	try {
		content = text ? JSON.parse(text) : null;
	} catch {
		// handled below with a readable status-based error
	}

	if (!res.ok) {
		throw new Error(content?.error || `Request failed (${res.status})`);
	}
	if (!content) {
		throw new Error("Invalid response from the CrUX API");
	}

	return content;
}

function onSubmit(e) {
	e.preventDefault();
	errors = {};

	const data = new URLSearchParams(new FormData(e.target));

	try {
		validateUrls(data.getAll("url").filter((item) => item.trim().length > 0));
	} catch (error) {
		errors.form = error.message;
		return;
	}

	// Let the fresh page load fetch the data once, from the shareable URL.
	window.location.href = `/?${data.toString()}`;
}
</script>

<form onsubmit={onSubmit} class="main-form">
    <input type="hidden" name="view" value={view} />
    <fieldset class="form-controls">
        <legend class="sr-only">Form Settings</legend>
        <div class="control-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    name="checkOrigin"
                    checked={initialData.checkOrigin}
                    aria-describedby="origin-help"
                />
                <span>origin</span>
            </label>
            <div id="origin-help" class="sr-only">
                Check this to compare origins instead of full URLs
            </div>
        </div>
        <div class="control-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    name="history"
                    checked={initialData.history}
                    aria-describedby="history-help"
                />
                <span>history</span>
            </label>
            <div id="history-help" class="sr-only">
                Check this to show 25-week trends from the CrUX History API
            </div>
        </div>
        <div class="control-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    name="experimental"
                    checked={initialData.experimental}
                    aria-describedby="experimental-help"
                />
                <span>experimental</span>
            </label>
            <div id="experimental-help" class="sr-only">
                Check this to include experimental Core Web Vitals with soft
                navigations (LCP-SN, CLS-SN, INP-SN, FCP-SN), navigation types
                with soft navigations and ad metrics
            </div>
        </div>
        <div class="control-group">
            <label for="form-factor" class="sr-only">Device Type</label>
            <select
                id="form-factor"
                name="formFactor"
                class="form-select"
                aria-describedby="form-factor-help"
            >
                {#each formFactorValues as formFactor}
                    {#if formFactor === initialData.formFactor}
                        <option value={formFactor} selected>{formFactor}</option>
                    {:else}
                        <option value={formFactor}>{formFactor}</option>
                    {/if}
                {/each}
            </select>
            <div id="form-factor-help" class="sr-only">
                Select device type for performance data
            </div>
        </div>
    </fieldset>

    <fieldset class="url-inputs">
        <legend>URLs to Analyze</legend>
        {#each initialData.url as item, i (i)}
            <div class="url-input-wrapper">
                <UiInput
                    name="url"
                    value={item}
                    placeholder="Enter URL..."
                    label=""
                    remove={removeItem(i)}
                    error={errors[`url_${i}`]}
                    touched={touched[`url_${i}`]}
                    onChange={(value) => handleUrlChange(i, value)}
                />
            </div>
        {/each}
        <div class="url-actions">
            <button
                type="button"
                class="add"
                onclick={addItem}
                aria-label="Add another URL input"
            >
                + Add URL
            </button>
            <button
                type="submit"
                class="submit"
                aria-describedby={errors.form ? 'form-error' : undefined}
            >
                Get CrUX Data
            </button>
        </div>

        {#if errors.form}
            <div
                id="form-error"
                class="form-error"
                role="alert"
                aria-live="polite"
            >
                <strong>Error:</strong>
                {errors.form}
            </div>
        {/if}
    </fieldset>
</form>

<div class="response">
    {#await promise}
        <p class="loader">
            <img src="/loader.svg" alt="loading" />
        </p>
    {:then content}
        {#if content.cruxData.error}
            <p class="error">{content.cruxData.error}</p>
        {:else}
            {#if content.warnings?.length}
                <div class="result-warning" role="status">
                    {#each content.warnings as warning}
                        <p>{warning}</p>
                    {/each}
                </div>
            {/if}
            <div class="result-header">
                <Header data={content.cruxData} />
                {#if activeView(content) === "overview" &&
                    content.cruxData.params?.dates?.length > 1}
                    <TrendPicker
                        dates={content.cruxData.params.dates}
                        bind:weeks={trendWeeks}
                    />
                {/if}
            </div>
            {#if hasAdvanced(content)}
                <div class="view-tabs" role="tablist" aria-label="Result views">
                    <button
                        type="button"
                        role="tab"
                        id="tab-overview"
                        aria-selected={activeView(content) === "overview"}
                        aria-controls="panel-result"
                        class:active={activeView(content) === "overview"}
                        onclick={() => setView("overview")}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="tab-advanced"
                        aria-selected={activeView(content) === "advanced"}
                        aria-controls="panel-result"
                        class:active={activeView(content) === "advanced"}
                        onclick={() => setView("advanced")}
                    >
                        Advanced
                    </button>
                </div>
            {/if}
            {#if activeView(content) === "advanced"}
                <div
                    class="result-panel"
                    id="panel-result"
                    role="tabpanel"
                    aria-labelledby="tab-advanced"
                >
                    <AdvancedMetrics data={content.advanced} />
                </div>
            {:else}
                <div
                    class="result-panel"
                    id="panel-result"
                    role="tabpanel"
                    aria-labelledby={hasAdvanced(content)
                        ? "tab-overview"
                        : undefined}
                >
                    <UrlsByMetric
                        data={content.cruxData}
                        bind:trendWeeks={trendWeeks}
                    />
                    <MetricsByUrl data={content.byMetric} />
                </div>
            {/if}
        {/if}
    {:catch error}
        <p class="error">{error.message}</p>
    {/await}
</div>

<style>
    .result-warning {
        margin: 12px 0;
        padding: 10px 14px;
        border: 1px solid color-mix(in srgb, var(--warning) 35%, transparent);
        border-radius: 3px;
        background: var(--warning-soft);
        color: var(--text-strong);
        font-size: 0.875rem;
    }

    .result-warning p {
        margin: 0;
    }

    .result-warning p + p {
        margin-top: 4px;
    }

    .result-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    }

    .view-tabs {
        display: inline-flex;
        gap: 2px;
        margin: 4px 0 12px;
        background: var(--border);
        border-radius: 4px;
        padding: 3px;
    }

    .view-tabs button {
        border: none;
        background: transparent;
        padding: 8px 18px;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-muted);
        border-radius: 3px;
        cursor: pointer;
        transition: all var(--transition);
    }

    .view-tabs button:hover:not(.active) {
        background: var(--border-strong);
    }

    .view-tabs button.active {
        background: var(--primary);
        color: var(--on-primary);
        box-shadow: var(--shadow-sm);
    }

    .view-tabs button:focus-visible {
        outline: 2px solid var(--ring);
        outline-offset: 2px;
    }

    .main-form {
        padding: var(--padding);
        padding-block: 20px;
        margin: 0;
        background-color: var(--surface-2);
        width: 100%;
        border-bottom: 2px solid var(--border);
    }

    .form-controls {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        align-items: center;
    }

    .control-group {
        display: flex;
        align-items: center;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-weight: 500;
    }

    .form-select {
        padding: 10px 12px;
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 3px;
        font-size: 14px;
        color: var(--text);
        min-width: 150px;
        transition: border-color var(--transition);
    }

    .form-select:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-soft);
    }

    .url-inputs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: stretch;
    }

    .url-input-wrapper {
        flex: 1;
        min-width: 300px;
        display: flex;
        flex-direction: column;
    }

    .url-actions {
        display: flex;
        gap: 12px;
        margin-top: 8px;
        flex-wrap: wrap;
        width: 100%;
        align-items: center;
    }

    .add,
    .submit {
        padding: 12px 20px;
        border: 1px solid transparent;
        border-radius: 2px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition);
    }

    .add {
        background-color: var(--surface);
        border-color: var(--border-strong);
        color: var(--text);
    }

    .add:hover {
        background-color: var(--surface-2);
        transform: translateY(-1px);
    }

    .submit {
        background-color: var(--primary);
        color: var(--on-primary);
    }

    .submit:hover:not(:disabled) {
        background-color: var(--primary-hover);
        transform: translateY(-1px);
    }

    .form-error {
        background-color: var(--danger-soft);
        color: var(--danger);
        padding: 12px 16px;
        border-radius: 3px;
        border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
        margin-top: 12px;
        font-size: 14px;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    fieldset {
        border: none;
        padding: 0;
        margin: 0;
    }

    legend {
        font-weight: 600;
        color: var(--text-strong);
        margin-bottom: 12px;
        font-size: 1.1rem;
    }

    @media (max-width: 768px) {
        .form-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
        }

        .control-group {
            justify-content: space-between;
        }

        .url-actions {
            flex-direction: column;
        }

        .add,
        .submit {
            width: 100%;
        }

        .url-inputs {
            flex-direction: column;
            gap: 12px;
        }

        .url-input-wrapper {
            min-width: auto;
        }
    }
</style>
