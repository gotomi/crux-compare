import svelte from "@astrojs/svelte";
// import netlify from "@astrojs/netlify";
import deno from "@deno/astro-adapter";
import { defineConfig } from "astro/config";

export default defineConfig({
	integrations: [svelte()],
	adapter: deno({ port: 8085, hostname: "0.0.0.0", start: true }),
	output: "server",
});
