# CrUX Compare

A web-based tool for comparing Chrome UX Report (CrUX) performance data across multiple origins or URLs. Built with [Astro](https://astro.build) and [Svelte](https://svelte.dev).

**Live tool: [crux.gotomi.info](https://crux.gotomi.info)**

## Overview

CrUX Compare helps you analyze and compare real-world user experience metrics from the Chrome UX Report. Compare performance data across different URLs or origins to identify performance differences, track improvements, and understand how your site performs on different device types (phone, tablet, desktop).

### Features

- **Multi-URL Comparison** - Analyze and compare CrUX data for multiple URLs simultaneously
- **Device Type Selection** - View metrics for all form factors, phones, tablets, or desktops
- **Flexible Analysis** - Compare full URLs or entire origins
- **History Comparison** - Track 25 weeks of CrUX History data with trend charts and weekly assessments
- **Visual Metrics Display** - Clear visualization of Core Web Vitals and other performance metrics
- **Real-time Data** - Fetch latest CrUX data directly from Google's API

## Tech Stack

- **Frontend Framework**: [Astro](https://astro.build) with [Svelte](https://svelte.dev) components
- **CrUX API Client**: [kruk](https://github.com/gotomi/kruk)
- **Language**: TypeScript/JavaScript
- **Package Manager**: npm

## Prerequisites

Before you begin, you'll need:

1. **Node.js** - Current LTS version or later
2. **Chrome UX Report API Key** - Required to access CrUX data
   - [Get your API Key](https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/getting-started#APIKey)
   - Requires a Google Cloud project with CrUX API enabled

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/gotomi/crux-compare.git
cd crux-compare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Key

Create a `.env.local` file in the project root with your CrUX API key:

```env
PSIKUS=your_api_key_here
```

Alternatively, set the environment variable in your system or in your deployment platform's environment settings.

### 4. Local Development

```bash
npm run dev
```

This will start the Astro development server at `http://localhost:4321`.

## Usage

1. Open the tool in your browser (localhost:4321 or deployed URL)
2. Enter one or more URLs to analyze in the URL input fields
3. Choose your device type preference (All Form Factors, Phone, Tablet, or Desktop)
4. Optionally check the "origin" box to compare origins instead of full URLs
5. Optionally check the "history" box to load 25 weeks of historical data
6. Click "Get CrUX Data" to fetch and display the metrics

### Example

- **URL**: `https://example.com/blog`
- **Origin Mode**: Unchecked (analyze specific URL)
- **Device Type**: Phone
- **Result**: See phone performance metrics for that specific URL

### History Mode

When the **history** checkbox is enabled, the tool queries the [CrUX History API](https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/history) and shows how each metric evolved over the last **25 weekly collection periods** (~6 months). Each data point covers a 28-day collection window.

- **Summary table** - shows the latest period's values plus a trend arrow (`▼3%` = better, `▲5%` = worse) comparing the latest p75 with ~12 weeks earlier. The header date range reflects the latest 28-day collection period, followed by the trend length (e.g. `📅 30/08/2026 - 26/09/2026 · 25-week trend`)
- **Trend charts** - each metric card shows a sparkline of the weekly p75. Line segments and points are colored by each week's assessment (good / needs improvement / poor), with a weekly rank strip underneath
- **Interactive points** - hover or focus a point to see the exact date, p75 value, and rank; click to pin the tooltip (useful on touch screens), click again or press Escape to unpin
- **Min/max scale** - each chart shows the p75 range and the trend's date span

All history settings are persisted in the URL, so trend views can be shared or bookmarked like regular comparisons.

## Project Structure

```
src/
├── pages/
│   ├── index.astro           # Main page
│   └── api/
│       └── getCrux.js        # API endpoint for CrUX API calls
├── components/
│   ├── CruxApp.svelte        # Main app component with form
│   ├── Header.svelte         # Results header
│   ├── MetricsByUrl.svelte   # Metrics organized by URL
│   ├── UrlsByMetric.svelte   # Metrics organized by device type
│   ├── Metric.svelte         # Individual metric display
│   ├── MetricHistory.svelte  # Metric trend chart (history mode)
│   ├── Legend.svelte         # Metric legend
│   ├── UiInput.svelte        # URL input component
│   ├── UrlWithIcon.svelte    # URL display with favicon
│   └── Header.svelte         # Page header
└── env.d.ts                  # TypeScript environment types
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## Deployment

Build the project for production:

```bash
npm run build
```

The build output is in the `dist/` directory. Deploy it to any hosting platform that supports Node.js or Deno (the project uses the Deno adapter). Set the `PSIKUS` environment variable on your platform to your CrUX API key.

## How It Works

1. **Frontend**: Users enter URLs and select filters through the Svelte interface
2. **Form Submission**: Form data is sent to the Astro API endpoint
3. **Backend Processing**: The `getCrux` endpoint uses the `kruk` library to query Google's CrUX API (regular or History endpoint)
4. **Data Transformation**: Results are processed and organized for display (history records are converted into weekly p75/histogram/rank series)
5. **Visualization**: Metrics are displayed side-by-side for easy comparison

## API Reference

### CrUX Data Structure

The tool displays the following metrics (when available):

- **Core Web Vitals**:
  - LCP (Largest Contentful Paint)
  - INP (Interaction to Next Paint)
  - CLS (Cumulative Layout Shift)
- **Additional Metrics**:
  - FCP (First Contentful Paint)
  - TTFB (Time to First Byte)
  - RTT (Round Trip Time)

### Device Types

- `ALL_FORM_FACTORS` - All device types combined
- `PHONE` - Mobile phone data
- `TABLET` - Tablet data
- `DESKTOP` - Desktop data
