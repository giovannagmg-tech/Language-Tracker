import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md deste repo aponta para o CLAUDE.md; não deixar o Next sobrescrever.
  agentRules: false,
  /* config options here */
};

export default nextConfig;
