<script>
import { onMount } from "svelte";
import { deleteQuery, getSavedQueries, saveQuery } from "../lib/savedQueries";

let open = $state(false);
let queries = $state([]);
let name = $state("");
let currentQuery = $state("");
let nameInput = $state(null);

const canSave = $derived(name.trim().length > 0 && currentQuery.length > 0);

onMount(() => {
	queries = getSavedQueries();
	currentQuery = window.location.search.slice(1);

	const onKey = (e) => {
		if (e.key === "Escape") open = false;
	};
	window.addEventListener("keydown", onKey);
	return () => window.removeEventListener("keydown", onKey);
});

function toggleDrawer() {
	open = !open;
	if (open) {
		queueMicrotask(() => nameInput?.focus());
	}
}

function closeDrawer() {
	open = false;
}

function save() {
	if (!canSave) return;
	queries = saveQuery(name.trim(), currentQuery);
	name = "";
}

function remove(id) {
	queries = deleteQuery(id);
}

function restore(query) {
	window.location.href = query ? `/?${query}` : "/";
}

function preview(query) {
	return query.length > 48 ? `${query.slice(0, 48)}…` : query;
}
</script>

<button
	type="button"
	class="fab"
	onclick={toggleDrawer}
	aria-expanded={open}
	aria-controls="saved-drawer"
>
	<!-- star -->
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="var(--header-star)"
		stroke-width="2"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path
			d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
		/>
	</svg>
	Saved
	{#if queries.length}<span class="count">{queries.length}</span>{/if}
</button>

{#if open}
	<div class="backdrop" onclick={closeDrawer} aria-hidden="true"></div>
{/if}

<aside
	id="saved-drawer"
	class="drawer"
	class:open
	role="dialog"
	aria-modal="true"
	aria-label="Saved queries"
	aria-hidden={!open}
>
	<header class="drawer-head">
		<h2>
			<!-- star -->
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="var(--header-star)"
				stroke-width="2"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path
					d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
				/>
			</svg>
			Saved queries
		</h2>
		<button
			type="button"
			class="icon-btn"
			onclick={closeDrawer}
			aria-label="Close saved queries"
		>
			✕
		</button>
	</header>

	<div class="save-form">
		<input
			bind:this={nameInput}
			bind:value={name}
			type="text"
			placeholder="Name this query…"
			aria-label="Saved query name"
			onkeydown={(e) => e.key === "Enter" && save()}
		/>
		<button type="button" class="save-btn" onclick={save} disabled={!canSave}>
			Save current
		</button>
		{#if !currentQuery}
			<p class="hint">Run a query first, then save it here.</p>
		{/if}
	</div>

	<ul class="query-list">
		{#each queries as q (q.id)}
			<li>
				<button
					type="button"
					class="query-row"
					onclick={() => restore(q.query)}
					title={q.query}
				>
					<span class="q-name">{q.name}</span>
					<span class="q-preview">{preview(q.query)}</span>
				</button>
				<button
					type="button"
					class="icon-btn del"
					onclick={(e) => {
						e.stopPropagation();
						remove(q.id);
					}}
					aria-label={`Delete ${q.name}`}
				>
					<!-- trash -->
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
						<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
						<path d="M10 11v6M14 11v6" />
					</svg>
				</button>
			</li>
		{:else}
			<li class="empty">No saved queries yet</li>
		{/each}
	</ul>
</aside>

<style>
	.fab {
		position: fixed;
		top: 16px;
		/* right of the theme toggle (toggle: right 60px, 44px wide) */
		right: 112px;
		z-index: 100;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 16px;
		border: 1px solid var(--header-btn-border);
		border-radius: var(--radius-header);
		background-color: var(--header-btn-bg);
		color: var(--header-text);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		box-shadow: var(--shadow-md);
		transition: background-color var(--transition), transform var(--transition);
	}

	.fab:hover {
		background-color: color-mix(in srgb, var(--header-btn-bg), #ffffff 10%);
		transform: translateY(-1px);
	}

	.fab .count {
		background: var(--header-pill);
		border-radius: 999px;
		padding: 1px 8px;
		font-size: 12px;
		font-weight: 600;
		color: #ffffff;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 90;
		background-color: var(--overlay);
		animation: fade-in 0.2s ease;
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 110;
		height: 100%;
		width: 340px;
		max-width: 100%;
		background-color: var(--surface);
		box-shadow: var(--shadow-lg);
		transform: translateX(100%);
		transition: transform 0.25s ease;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.drawer.open {
		transform: translateX(0);
	}

	.drawer-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 2px solid var(--border);
		background-color: var(--header-bg);
		color: var(--header-text);
	}

	.drawer-head h2 {
		margin: 0;
		font-size: 1.1rem;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 3px;
		background: transparent;
		color: inherit;
		font-size: 16px;
		cursor: pointer;
		transition: background-color var(--transition);
	}

	.drawer-head .icon-btn:hover {
		background-color: rgba(255, 255, 255, 0.15);
	}

	.save-form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 16px;
		border-bottom: 1px solid var(--border);
		background-color: var(--surface-2);
	}

	.save-form input {
		flex: 1;
		min-width: 140px;
		padding: 10px 12px;
		border: 2px solid var(--border);
		border-radius: 3px;
		font-size: 14px;
		color: var(--text);
		background: var(--surface);
		transition: border-color var(--transition);
	}

	.save-form input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--primary-soft);
	}

	.save-btn {
		padding: 10px 16px;
		border: none;
		border-radius: 2px;
		background-color: var(--primary);
		color: var(--on-primary);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color var(--transition), transform var(--transition);
	}

	.save-btn:hover:not(:disabled) {
		background-color: var(--primary-hover);
		transform: translateY(-1px);
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.hint {
		width: 100%;
		margin: 0;
		font-size: 13px;
		color: var(--text-muted);
	}

	.query-list {
		list-style: none;
		margin: 0;
		padding: 8px;
		flex: 1;
	}

	.query-list li {
		display: flex;
		align-items: stretch;
		gap: 4px;
		margin-bottom: 4px;
		border-radius: 3px;
		overflow: hidden;
	}

	.query-list li:hover {
		background-color: var(--surface-2);
	}

	.query-row {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 12px;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		font: inherit;
		color: inherit;
	}

	.q-name {
		font-weight: 600;
		font-size: 14px;
		color: var(--text-strong);
	}

	.q-preview {
		font-size: 12px;
		color: var(--text-muted);
		word-break: break-all;
	}

	.icon-btn.del {
		width: 40px;
		color: var(--text-muted);
	}

	.icon-btn.del:hover {
		background-color: var(--danger-soft);
		color: var(--danger);
	}

	.empty {
		padding: 24px 12px;
		text-align: center;
		color: var(--text-muted);
		font-size: 14px;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.drawer {
			width: 100%;
		}

		/* move below the content on small screens, next to the theme toggle */
		.fab {
			top: auto;
			bottom: 16px;
		}
	}
</style>
