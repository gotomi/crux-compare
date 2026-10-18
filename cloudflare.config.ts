import { defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .dev.vars, .env, .env.example, dist/server/.dev.vars. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
	worker: {
		name: "crux-compare",
		compatibilityDate: "2026-10-01",
		compatibilityFlags: [
			"nodejs_compat",
		],
		observability: {
			enabled: true,
		},
	},
});
