import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import netlify from "@astrojs/netlify";

export default defineConfig({
	integrations: [svelte()],
	adapter: netlify(),
	output: "server",
});
