import fs from "node:fs";
import { expect, test } from "@playwright/test";

const ESTADO = "e2e/.sessao.json";

/**
 * Os três fluxos críticos. Precisam de uma sessão real: o login é por magic
 * link, que não dá para automatizar sem acesso à caixa de e-mail.
 *
 * Para gravar a sessão uma vez:  npm run e2e:sessao
 * O arquivo fica em e2e/.sessao.json e está no .gitignore.
 */
test.describe("com sessão", () => {
  test.skip(
    !fs.existsSync(ESTADO),
    "Sessão não gravada. Rode `npm run e2e:sessao` e faça login uma vez.",
  );

  test.use({ storageState: ESTADO });

  test("registrar uma sessão pelo teclado", async ({ page }) => {
    await page.goto("/registro");

    await page.getByRole("radio", { name: /podcast/i }).click();
    await expect(page.getByText("Imersão", { exact: true })).toBeVisible();

    await page.keyboard.press("Control+Enter");
    await expect(page.getByRole("status").first()).toContainText(/podcast/i);
  });

  test("trocar de marcha muda as tarefas do dia", async ({ page }) => {
    await page.goto("/hoje");
    const titulo = page.getByRole("heading", { name: /^Marcha/ });
    const antes = await titulo.textContent();

    await page.keyboard.press("2");
    await expect(titulo).not.toHaveText(antes ?? "", { timeout: 10_000 });
  });

  test("a tela de importação aceita um CSV e mostra a pré-visualização", async ({ page }) => {
    await page.goto("/importacao");

    const csv = [
      "Project,Description,Start date,Start time,Duration",
      "Imersão Inglês,Netflix,2026-01-05,08:00:00,1:00:00",
      "Flashcards Inglês,criação,2026-01-06,07:00:00,0:20:00",
    ].join("\n");

    await page.setInputFiles('input[type="file"]', {
      name: "toggl-teste.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });

    await expect(page.getByRole("heading", { name: /pré-visualização/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Todas/ })).toContainText("2");
  });

  test("o piso diário responde ao clique", async ({ page }) => {
    await page.goto("/hoje");
    await expect(page.getByRole("heading", { name: "Piso diário" })).toBeVisible();
    await page.getByRole("button", { name: /falei 1 min/i }).click();
    await expect(page.getByRole("status").first()).toContainText(/minuto/i);
  });
});
