import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// TZ=UTC de propósito: é o fuso do servidor da Vercel. Se um teste de data
// passa aqui, passa em produção. Ver regra 3 do CLAUDE.md.
process.env.TZ = "UTC";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    // Domínio roda em node. Teste de componente declara `// @vitest-environment jsdom`
    // no topo do arquivo.
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
