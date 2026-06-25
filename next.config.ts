import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	/**
	 * Don't analyze or bundle `voyageai` — treat it as an external
	 * module that Bun resolves at runtime. Done due to broken ESM/
	 * CJS imports/requires with the package.
	 * TODO: replace it with something else
	 */
	serverExternalPackages: ["voyageai"],

	// Security headers — Vercel adds HSTS by default, these cover the rest
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},
};

export default nextConfig;
