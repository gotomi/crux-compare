<script>
import { onMount } from "svelte";
import AdvancedMetrics from "./AdvancedMetrics.svelte";
import Header from "./Header.svelte";
import MetricsByUrl from "./MetricsByUrl.svelte";
import UiInput from "./UiInput.svelte";
import UrlsByMetric from "./UrlsByMetric.svelte";

const formFactorValues = ["ALL_FORM_FACTORS", "PHONE", "DESKTOP", "TABLET"];

let initialData = $state({
	url: [""],
	checkOrigin: true,
	formFactor: "PHONE",
	history: false,
});

let promise = $state(Promise.reject(new Error("")));
let isLoading = $state(false);
let errors = $state({});
let touched = $state({});
let view = $state("overview");

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

	if (data.get("view") === "advanced") {
		view = "advanced";
	}

	if (url.length) {
		initialData.url = url;
		initialData.checkOrigin = checkOrigin;
		initialData.formFactor = formFactor;
		initialData.history = history;
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
	const content = await res.json();
	if (res.ok) {
		return content;
	} else {
		throw new Error(content);
	}
}

async function onSubmit(e) {
	e.preventDefault();

	isLoading = true;
	errors = {};

	try {
		const data = new URLSearchParams(new FormData(e.target));
		const result = await getCrux(data);
		promise = Promise.resolve(result);
		window.location.href = `/?${data.toString()}`;
	} catch (error) {
		errors.form = error.message;
		promise = Promise.reject(error);
	} finally {
		isLoading = false;
	}
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
                disabled={isLoading}
                aria-label="Add another URL input"
            >
                + Add URL
            </button>
            <button
                type="submit"
                class="submit"
                disabled={isLoading}
                aria-describedby={errors.form ? 'form-error' : undefined}
            >
                {#if isLoading}
                    <span class="loading-spinner" aria-hidden="true">⟳</span>
                    <span>Loading...</span>
                {:else}
                    Get CrUX Data
                {/if}
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

{#if isLoading}
    <p class="sr-only" aria-live="polite">Loading CrUX data, please wait...</p>
{/if}

<div class="response">
    {#await promise}
        <p class="loader">
            <img src="/loader.svg" alt="loading" />
        </p>
    {:then content}
        {#if content.cruxData.error}
            <p class="error">{content.cruxData.error}</p>
        {:else}
            <Header data={content.cruxData} />
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
                    <UrlsByMetric data={content.cruxData} />
                    <MetricsByUrl data={content.byMetric} />
                </div>
            {/if}
        {/if}
    {:catch error}
        <p class="error">{error.message}</p>
    {/await}
</div>

<style>
    .view-tabs {
        display: inline-flex;
        gap: 2px;
        margin: 4px 0 12px;
        background: #e9ecef;
        border-radius: 4px;
        padding: 3px;
    }

    .view-tabs button {
        border: none;
        background: transparent;
        padding: 8px 18px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #495057;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .view-tabs button:hover:not(.active) {
        background: #dee2e6;
    }

    .view-tabs button.active {
        background: #007bff;
        color: #fff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    }

    .view-tabs button:focus-visible {
        outline: 2px solid #007bff;
        outline-offset: 2px;
    }

    .main-form {
        padding: var(--padding);
        padding-block: 20px;
        margin: 0;
        background-color: #f8f9fa;
        width: 100%;
        border-bottom: 2px solid #e9ecef;
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
        background: #fff;
        border: 2px solid #e9ecef;
        border-radius: 3px;
        font-size: 14px;
        min-width: 150px;
        transition: border-color 0.2s ease;
    }

    .form-select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
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
        border: none;
        border-radius: 2px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .add {
        background-color: #6c757d;
        color: white;
    }

    .add:hover {
        background-color: #5a6268;
        transform: translateY(-1px);
    }

    .submit {
        background-color: #007bff;
        color: white;
    }

    .submit:hover:not(:disabled) {
        background-color: #0056b3;
        transform: translateY(-1px);
    }

    .add:disabled,
    .submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .loading-spinner {
        display: inline-block;
        animation: spin 1s linear infinite;
        margin-right: 8px;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .form-error {
        background-color: #f8d7da;
        color: #721c24;
        padding: 12px 16px;
        border-radius: 3px;
        border: 1px solid #f5c6cb;
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
        color: var(--dark);
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
