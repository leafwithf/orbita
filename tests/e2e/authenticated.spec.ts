import { expect, test, type Page } from "@playwright/test";

/**
 * Fluxos A–D (onboarding, ideia, projeto, foco) + Etapa 4 (quadro, busca,
 * histórico, lixeira) com uma conta REAL de um projeto Supabase de DEV.
 *
 * Requer: E2E_EMAIL e E2E_PASSWORD de um usuário já cadastrado (com "Confirm
 * email" desativado ou e-mail confirmado). Sem elas, a suíte é ignorada.
 * Rode com:  npx playwright test authenticated --project=desktop-chromium
 * Os testes são seriais e criam itens com sufixo único; nada é apagado de verdade.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const run = Date.now().toString(36);

test.skip(!email || !password, "Defina E2E_EMAIL e E2E_PASSWORD para rodar a suíte autenticada.");
test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email as string);
  await page.getByLabel("Senha", { exact: true }).fill(password as string);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("A · onboarding pode ser concluído ou já estar feito; a visão geral abre", async ({ page }) => {
  if (new URL(page.url()).pathname.startsWith("/bem-vindo")) {
    await page.getByRole("button", { name: "Entrar no meu espaço" }).first().click();
    await page.waitForURL((url) => !url.pathname.startsWith("/bem-vindo"));
  }
  await expect(page.getByRole("navigation").first()).toBeVisible();
});

test("B · ideia com título único e conversão em projeto", async ({ page }) => {
  const title = `Ideia E2E ${run}`;
  await page.goto("/criar?tipo=ideia");
  await page.getByLabel("Qual é a ideia?").fill(title);
  await page.getByRole("button", { name: "Salvar ideia" }).click();
  await page.waitForURL("**/backlog");
  const card = page.getByRole("listitem").filter({ hasText: title });
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: "Converter em projeto" }).click();
  await page.waitForURL("**/projetos/**");
  await expect(page.getByText(title).first()).toBeVisible();

  await page.goto("/backlog");
  await expect(page.getByRole("listitem").filter({ hasText: title }).getByText("Virou projeto")).toBeVisible();
});

test("C · projeto com próximo passo", async ({ page }) => {
  const title = `Projeto E2E ${run}`;
  await page.goto("/criar?tipo=projeto");
  await page.getByLabel("Nome do projeto").fill(title);
  await page.getByLabel("Próximo passo").fill("Definir escopo");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await page.waitForURL("**/projetos/**");
  await expect(page.getByText(title).first()).toBeVisible();
});

test("D · foco principal com confirmação", async ({ page }) => {
  await page.goto("/projetos");
  await page.getByRole("link", { name: new RegExp(`Projeto E2E ${run}`) }).first().click();
  await page.getByRole("button", { name: /Definir como principal|Trocar/ }).first().click();
  await page.getByRole("button", { name: /Confirmar|Definir|Trocar/ }).last().click();
  await expect(page.getByText(/Foco atualizado|principal/i).first()).toBeVisible();
});

test("Etapa 4 · tarefa no quadro: mover por teclado, concluir e desfazer", async ({ page }) => {
  const title = `Tarefa E2E ${run}`;
  await page.goto("/criar?tipo=tarefa");
  await page.getByLabel("O que precisa ser feito?").fill(title);
  await page.getByRole("button", { name: "Criar tarefa" }).click();
  await page.waitForURL("**/tarefas**");

  await page.goto("/tarefas/quadro");
  const todo = page.getByRole("region", { name: /A fazer/ });
  await expect(todo.getByText(title)).toBeVisible();

  const next = page.getByRole("button", { name: `Mover ${title} para a próxima coluna` });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: /Em andamento/ }).getByText(title)).toBeVisible();

  await page.getByRole("button", { name: `Mover ${title} para a próxima coluna` }).click();
  await expect(page.getByRole("region", { name: /Concluída/ }).getByText(title)).toBeVisible();

  await page.getByRole("button", { name: "Desfazer" }).click(); // dentro da janela de 5–6 s
  await expect(page.getByRole("region", { name: /Em andamento/ }).getByText(title)).toBeVisible();
});

test("Etapa 4 · busca sem acento, histórico e lixeira com restauração", async ({ page }) => {
  await page.goto(`/busca?q=${encodeURIComponent(`projeto e2e ${run}`)}`);
  await expect(page.getByRole("link", { name: new RegExp(`Projeto E2E ${run}`) }).first()).toBeVisible();

  await page.goto("/historico");
  await expect(page.getByText(new RegExp(`Você criou .*E2E ${run}`)).first()).toBeVisible();

  const title = `Tarefa E2E ${run}`;
  await page.goto("/tarefas/quadro");
  await page.getByRole("button", { name: `Excluir ${title}` }).click();
  await page.goto("/lixeira");
  await page.getByRole("button", { name: `Restaurar ${title}` }).click();
  await page.goto("/tarefas/quadro");
  await expect(page.getByText(title)).toBeVisible();
});

// ---------------------------------------------------------------------------
// Etapa 5 · arquivos
// ---------------------------------------------------------------------------
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("Etapa 5 · envia imagem válida e ela fica pronta, com visualização e exclusão", async ({ page }) => {
  const name = `imagem-${run}.png`;
  await page.goto("/arquivos");
  await page.locator("#file-input").setInputFiles({ name, mimeType: "image/png", buffer: PNG_1X1 });

  const row = page.getByRole("listitem").filter({ hasText: name });
  await expect(row.getByText("Pronto")).toBeVisible({ timeout: 30_000 });
  await expect(row.getByRole("link", { name: `Visualizar ${name}` })).toBeVisible();

  await row.getByRole("button", { name: `Excluir ${name}` }).click();
  await expect(page.getByRole("button", { name: `Excluir ${name}` })).toHaveCount(0);
});

test("Etapa 5 · arquivo disfarçado (texto com extensão .png) vai para análise", async ({ page }) => {
  const name = `falso-${run}.png`;
  await page.goto("/arquivos");
  await page.locator("#file-input").setInputFiles({
    name,
    mimeType: "image/png",
    buffer: Buffer.from("isto não é uma imagem de verdade"),
  });
  await expect(page.getByText(/ficou em análise|Em análise/).first()).toBeVisible({ timeout: 30_000 });
});

test("Etapa 5 · tipo inválido e arquivo acima de 25 MB são recusados antes do envio", async ({ page }) => {
  await page.goto("/arquivos");
  await page.locator("#file-input").setInputFiles({ name: "programa.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
  await expect(page.getByText("Este tipo de arquivo não é permitido por segurança.")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: `grande-${run}.pdf`,
    mimeType: "application/pdf",
    buffer: Buffer.alloc(25 * 1024 * 1024 + 1),
  });
  await expect(page.getByText("O arquivo passa de 25 MB.")).toBeVisible();
});

test("Etapa 5 · upload de 20 MB (use --project=mobile-chromium)", async ({ page }) => {
  test.slow();
  const name = `20mb-${run}.png`;
  const buffer = Buffer.concat([PNG_SIGNATURE, Buffer.alloc(20 * 1024 * 1024 - PNG_SIGNATURE.length)]);
  await page.goto("/arquivos");
  await page.locator("#file-input").setInputFiles({ name, mimeType: "image/png", buffer });
  const row = page.getByRole("listitem").filter({ hasText: name });
  await expect(row.getByText("Pronto")).toBeVisible({ timeout: 180_000 });
  await row.getByRole("button", { name: `Excluir ${name}` }).click();
});
