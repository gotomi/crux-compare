import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
// import netlify from "@astrojs/netlify";
import deno from "@deno/astro-adapter";

export default defineConfig({
  integrations: [svelte()],
  adapter: deno(),
  output: "server",
});
