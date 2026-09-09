import { expect, test } from "@playwright/test";

/**
 * O que dá para verificar sem sessão. Cobre o bug que derrubou a produção:
 * o proxy quebrado devolvia 500 em toda rota, inclusive no login.
 */
test.describe("acesso sem sessão", () => {
  test("a raiz manda para o login", async ({ page }) => {
    const resposta = await page.goto("/");
    expect(resposta?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login/);
  });

  test("rota protegida manda para o login em vez de 500", async ({ page }) => {
    const resposta = await page.goto("/hoje");
    expect(resposta?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login/);
  });

  test("a tela de login mostra o formulário", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar com link/i })).toBeVisible();
    await expect(page.getByText(/só e-mails autorizados/i)).toBeVisible();
  });

  test("e-mail fora da lista é recusado, sem prometer que enviou", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("naoautorizado@exemplo.com");
    await page.getByRole("button", { name: /entrar com link/i }).click();
    await expect(page.getByRole("status")).toContainText(/não tem acesso/i);
  });

  test("o tema é pintado antes do primeiro frame", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("poliglota-tema", "escuro"));
    await page.goto("/login");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("erro no link volta com o motivo visível", async ({ page }) => {
    await page.goto("/login?erro=link_expirado");
    await expect(page.getByRole("alert")).toContainText(/expirou/i);
  });
});
