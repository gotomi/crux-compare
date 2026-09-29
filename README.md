# CrUX Compare

A web tool for comparing Chrome UX Report (CrUX) field data across multiple origins or URLs. Built with [Astro](https://astro.build) and [Svelte 5](https://svelte.dev).

**Live tool: [crux.gotomi.info](https://crux.gotomi.info)**

## Features

- **Multi-URL comparison** — analyze up to 10 origins/URLs side by side, sorted by Core Web Vitals performance
- **Overview tab** — the classic CrUX metrics (LCP, CLS, INP, TTFB, FCP, RTT) as a summary table with trend badges against a selectable comparison week (default: 1 week earlier) plus per-metric cards with histogram bars
- **Advanced tab** — kruk 0.5.0-beta's newer CrUX metrics:
  - **Navigation Types** — how page loads start (navigate, reload, back/forward incl. bfcache, prerender) as 100% stacked bars
  - **Form Factors** — desktop / phone / tablet share of page loads (available when the device filter is `ALL_FORM_FACTORS`)
  - **LCP Resource Type** — image vs text LCP element
  - **LCP Image Phases** — p75 breakdown in ms: time to first byte, resource load delay, load duration, element render delay
- **History mode** — 25-week CrUX History trends with sparklines and weekly rank strips (Overview tab; the Advanced tab is a follow-up)
- **Shareable state** — all form options and the active tab persist in the URL (`?url=…&history&view=advanced`)

## Tech Stack

- [Astro](https://astro.build) (SSR, Deno adapter) + [Svelte 5](https://svelte.dev) (runes)
- [kruk](https://github.com/gotomi/kruk) `0.5.0-beta` — CrUX API client (classic + advanced metrics, History API)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) — `get-crux-data` MCP tool

## Getting Started

### 1. Install

```bash
git clone git@github.com:gotomi/crux-compare.git
cd crux-compare
npm install
```

### 2. Configure

Create `.env` in the project root:

```env
PSIKUS=your_crux_api_key
MCP_TOKEN=your_mcp_token
```

- `PSIKUS` — CrUX API key ([get one here](https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/api-key))
- `MCP_TOKEN` — bearer token protecting the MCP endpoint

### 3. Run

```bash
npm run dev
```

## Usage

1. Enter one or more URLs, toggle **origin** to compare origins instead of full pages, pick a device filter, optionally enable **history**
2. Switch between the **Overview** and **Advanced** tabs above the results — the active tab is stored in the URL
3. The Advanced tab requires no extra setup: the new metrics are fetched in the same CrUX request as the classic ones

## API

### `POST /api/getCrux`

Form-encoded body: `url` (repeatable), `checkOrigin`, `formFactor`, `history`.
Returns `{ cruxData, byMetric, advanced }` — raw records, the grouped classic metrics, and the grouped advanced metrics.

### `POST /api/mcp`

MCP endpoint (JSON-RPC, `Authorization: Bearer $MCP_TOKEN`, stateless streamable HTTP).
Exposes the `get-crux-data` tool (`urls`, `formFactor`, `checkOrigin` arguments); the response text contains the same `{ cruxData, byMetric, advanced }` envelope.

## Project Structure

```
src/
├── components/
│   ├── CruxApp.svelte          # form + results orchestrator, Overview/Advanced tabs
│   ├── AdvancedMetrics.svelte  # Advanced tab sections
│   ├── FractionCard.svelte     # 100% stacked bars for fraction metrics
│   ├── LcpPhases.svelte        # LCP image phase breakdown
│   ├── UrlsByMetric.svelte     # Overview summary table + trend badges
│   ├── MetricsByUrl.svelte     # per-metric sections (mode switch)
│   ├── Metric.svelte           # standard metric card
│   ├── MetricHistory.svelte    # history card with sparkline
│   ├── Legend.svelte           # metric thresholds legend
│   ├── Header.svelte           # collection period summary line
│   ├── SavedQueries.svelte     # saved queries drawer
│   ├── UrlWithIcon.svelte      # favicon + URL
│   └── UiInput.svelte          # URL input with validation
├── lib/
│   ├── crux.ts                 # metric constants, converters, grouping
│   ├── auth.ts                 # MCP token auth
│   ├── rateLimit.ts            # per-identity rate limiting
│   └── savedQueries.ts         # localStorage persistence
└── pages/
    ├── index.astro             # the page
    └── api/
        ├── getCrux.js          # CrUX proxy endpoint
        ├── mcp.ts              # MCP endpoint (get-crux-data tool)
        └── test.ts             # health check
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | start the dev server |
| `npm run build` | production build (Deno adapter) |
| `npm run preview` | preview the production build |
| `npm run lint` / `lint:fix` | Biome lint |
| `npm run format` / `format:fix` | Biome format |
| `npm run check` / `check:fix` | Biome check (lint + format) |

## Deployment

Build with `npm run build` and deploy the `dist/` output to a Deno-capable host (the project uses `@deno/astro-adapter`). Set `PSIKUS` and `MCP_TOKEN` in the hosting environment.
