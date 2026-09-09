import { chromium } from "@playwright/test";

/**
 * Abre um navegador para você fazer o login uma vez e grava os cookies.
 * O magic link chega no seu e-mail; nada aqui automatiza isso — e é bom que
 * não automatize.
 */
async function principal() {
  const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const navegador = await chromium.launch({ headless: false });
  const contexto = await navegador.newContext({ locale: "pt-BR" });
  const pagina = await contexto.newPage();

  await pagina.goto(`${base}/login`);
  console.log("Faça o login. Assim que a tela Hoje abrir, a sessão é gravada.");

  await pagina.waitForURL("**/hoje", { timeout: 5 * 60_000 });
  await contexto.storageState({ path: "e2e/.sessao.json" });

  console.log("Sessão gravada em e2e/.sessao.json");
  await navegador.close();
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
