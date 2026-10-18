import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
	integrations: [svelte()],
	adapter: cloudflare(),
	output: "server",
});
