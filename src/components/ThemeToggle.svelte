<script>
const MODES = ["system", "light", "dark"];
const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

// Start in the SSR-safe default; $effect on mount syncs with localStorage.
let mode = $state("system");

const nextMode = $derived(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
const labels = {
	system: "system preference",
	light: "light",
	dark: "dark",
};

function prefersDark() {
	return window.matchMedia(MEDIA_QUERY).matches;
}

function applyTheme() {
	const dark = mode === "system" ? prefersDark() : mode === "dark";
	document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function cycle() {
	mode = nextMode;
	localStorage.setItem(STORAGE_KEY, mode);
	applyTheme();
}

$effect(() => {
	const stored = localStorage.getItem(STORAGE_KEY);
	mode = MODES.includes(stored) ? stored : "system";
	applyTheme();

	const media = window.matchMedia(MEDIA_QUERY);
	media.addEventListener("change", applyTheme);
	return () => media.removeEventListener("change", applyTheme);
});
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={cycle}
	aria-label="Color theme: {labels[mode]}. Activate to switch to {labels[nextMode]}."
	title="Color theme: {labels[mode]}"
>
	{#if mode === "light"}
		<!-- sun -->
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
			/>
		</svg>
	{:else if mode === "dark"}
		<!-- moon -->
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	{:else}
		<!-- monitor (system) -->
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<rect x="2" y="3" width="20" height="14" rx="2" />
			<path d="M8 21h8M12 17v4" />
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		/* fixed top-right, left of the Saved button (FAB: right 112px) */
		position: fixed;
		top: 16px;
		right: 60px;
		z-index: 101;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 1px solid var(--header-btn-border);
		border-radius: var(--radius-header);
		background: var(--header-btn-bg);
		color: var(--header-text);
		cursor: pointer;
		transition: background var(--transition);
	}

	.theme-toggle:hover {
		background: color-mix(in srgb, var(--header-btn-bg), #ffffff 10%);
	}

	@media (max-width: 768px) {
		/* move below the header text on small screens (FAB cluster) */
		.theme-toggle {
			top: auto;
			bottom: 16px;
		}
	}
</style>
