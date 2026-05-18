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
};

export default nextConfig;
