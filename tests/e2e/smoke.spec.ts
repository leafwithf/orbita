import { expect, test } from "@playwright/test";

test.describe("entrada", () => {
  test("mostra o formulário de login em português", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Entrar no ÓRBITA" }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar conta" })).toBeVisible();
  });

  test("marca os campos essenciais como obrigatórios", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("E-mail")).toHaveAttribute("required", "");
    await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
      "required",
      "",
    );
  });

  test("explica como criar uma conta", async ({ page }) => {
    await page.goto("/criar-conta");

    await expect(
      page.getByRole("heading", { name: "Criar sua conta" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Como você quer ser chamado?"),
    ).toBeVisible();
  });
});

test.describe("proteção de rotas", () => {
  test("manda visitantes para o login", async ({ page }) => {
    await page.goto("/projetos");

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(
      page.getByRole("heading", { name: "Entrar no ÓRBITA" }),
    ).toBeVisible();
  });

  test("não renderiza a área interna sem sessão", async ({ page }) => {
    const response = await page.goto("/configuracoes");

    // The proxy/layout redirect lands on the public login screen.
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Configurações")).toHaveCount(0);
  });
});

test.describe("fundação PWA", () => {
  test("serve o manifest com nome, ícones e atalhos", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);

    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      icons: { src: string; sizes: string }[];
    };

    expect(manifest.name).toContain("ÓRBITA");
    expect(manifest.short_name).toBe("ÓRBITA");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.some((icon) => icon.sizes === "512x512")).toBe(true);
  });

  test("mostra uma página offline útil", async ({ page }) => {
    await page.goto("/offline");

    await expect(
      page.getByRole("heading", { name: "Você está offline." }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Tentar novamente/ }),
    ).toBeVisible();
  });
});
