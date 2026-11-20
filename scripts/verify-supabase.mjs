#!/usr/bin/env node
// Verificação ponta a ponta no Supabase REAL, usando só a anon key (sem service role).
// Uso: node --env-file=.env.local scripts/verify-supabase.mjs
// Pré-requisito: migrações aplicadas e "Confirm email" DESATIVADO no projeto de DEV
// (Authentication → Providers → Email), para o signUp já devolver sessão.
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY");

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${ok || !detail ? "" : ` — ${detail}`}`);
};
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function signUp(tag) {
  const c = client();
  const email = `orbita.${tag}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  const { data, error } = await c.auth.signUp({ email, password: "Teste-Orbita-12345" });
  if (error || !data.session) throw new Error(`signUp ${tag} falhou (${error?.message ?? "sem sessão: desative Confirm email"})`);
  const { data: m } = await c.from("workspace_members").select("workspace_id").eq("user_id", data.user.id).single();
  return { c, id: data.user.id, ws: m?.workspace_id };
}

// 1. anon não lê nada
const anon = client();
for (const t of ["projects", "tasks", "ideas", "profiles", "workspaces", "activity_events"]) {
  const { data, error } = await anon.from(t).select("id").limit(1);
  check(`anon sem acesso a ${t}`, !!error || (data ?? []).length === 0);
}

// 2. dois usuários, isolamento
const A = await signUp("a");
const B = await signUp("b");
check("signup provisiona espaço pessoal", !!A.ws && !!B.ws);

const { data: proj, error: pErr } = await A.c.from("projects").insert({ workspace_id: A.ws, title: "Projeto A", created_by: A.id }).select("id").single();
check("A cria projeto no próprio espaço", !pErr && !!proj, pErr?.message);
const { data: bRead } = await B.c.from("projects").select("id").eq("id", proj?.id ?? "");
check("B não lê projeto de A", (bRead ?? []).length === 0);
const { error: bIns } = await B.c.from("projects").insert({ workspace_id: A.ws, title: "Invasão", created_by: B.id });
check("B não cria projeto no espaço de A", !!bIns);
const { data: bUpd } = await B.c.from("projects").update({ title: "hack" }).eq("id", proj.id).select();
check("B não edita projeto de A", (bUpd ?? []).length === 0);

// 3. foco único sob concorrência (duas sessões do mesmo usuário, 30 trocas paralelas)
const { data: p2 } = await A.c.from("projects").insert({ workspace_id: A.ws, title: "Projeto A2", created_by: A.id }).select("id").single();
const targets = [proj.id, p2.id];
const runs = await Promise.all(Array.from({ length: 30 }, (_, i) => A.c.rpc("set_primary_focus", { p_workspace: A.ws, p_kind: "project", p_target: targets[i % 2] })));
check("30 trocas concorrentes de foco sem erro", runs.every((r) => !r.error), runs.find((r) => r.error)?.error?.message);
const { data: foc } = await A.c.from("focus_assignments").select("target_id").eq("workspace_id", A.ws).eq("kind", "project");
check("exatamente 1 foco de projeto ao final", (foc ?? []).length === 1);

// 4. Etapa 4: conclusão, histórico, conversão, busca
const { data: task } = await A.c.from("tasks").insert({ workspace_id: A.ws, project_id: proj.id, title: "Escrever copy", created_by: A.id, assignee_id: A.id }).select("id").single();
await A.c.from("tasks").update({ status: "done" }).eq("id", task.id);
const { data: done } = await A.c.from("tasks").select("completed_at").eq("id", task.id).single();
check("completed_at definido ao concluir", !!done?.completed_at);
await A.c.from("tasks").update({ status: "todo" }).eq("id", task.id);
const { data: undone } = await A.c.from("tasks").select("completed_at").eq("id", task.id).single();
check("completed_at limpo ao desfazer", undone?.completed_at === null);
const { data: ev } = await A.c.from("activity_events").select("verb").eq("entity_id", task.id);
check("histórico registrou created/completed/reopened", ["created", "completed", "reopened"].every((v) => (ev ?? []).some((e) => e.verb === v)));

const { data: idea } = await A.c.from("ideas").insert({ workspace_id: A.ws, title: "Organização da casa", created_by: A.id }).select("id").single();
const conv = await A.c.rpc("convert_idea_to_project", { p_idea: idea.id });
check("converter ideia em projeto", !conv.error && !!conv.data, conv.error?.message);
const conv2 = await A.c.rpc("convert_idea_to_project", { p_idea: idea.id });
check("converter duas vezes é recusado", !!conv2.error);
const found = await A.c.rpc("search_workspace", { p_workspace: A.ws, p_query: "organizacao" });
check("busca sem acento encontra", !found.error && (found.data ?? []).length >= 1, found.error?.message);
const leak = await B.c.rpc("search_workspace", { p_workspace: A.ws, p_query: "organizacao" });
check("busca não vaza para B", (leak.data ?? []).length === 0);

// 5. Etapa 6: colaboração (convite, papéis, isolamento, comentários, notificações)
const mkToken = () => { const t = randomBytes(32).toString("base64url"); return { t, h: createHash("sha256").update(t, "utf8").digest("hex") }; };
const C = await signUp("c");
const team = await A.c.rpc("create_workspace", { p_name: "Equipe verificação", p_kind: "team" });
check("A cria espaço de equipe", !team.error && !!team.data, team.error?.message);
const TW = team.data;
const personalInvite = await A.c.rpc("create_invitation", { p_workspace: A.ws, p_role: "editor", p_email: null, p_token_hash: mkToken().h });
check("espaço pessoal não aceita convite", !!personalInvite.error);
const inv = mkToken();
const mk = await A.c.rpc("create_invitation", { p_workspace: TW, p_role: "editor", p_email: null, p_token_hash: inv.h });
check("dono cria convite", !mk.error, mk.error?.message);
const bBefore = await B.c.from("projects").select("id").eq("workspace_id", TW);
check("B sem convite aceito não vê o espaço", (bBefore.data ?? []).length === 0);
const { error: selfJoin } = await B.c.from("workspace_members").insert({ workspace_id: TW, user_id: B.id, role: "owner", status: "active" });
check("ninguém entra sem convite (insert direto recusado)", !!selfJoin);
const acc = await Promise.all(Array.from({ length: 8 }, () => B.c.rpc("accept_invitation", { p_token_hash: inv.h })));
check("convite aceito por exatamente 1 chamada em paralelo", acc.filter((r) => !r.error).length === 1);
const reuse = await C.c.rpc("accept_invitation", { p_token_hash: inv.h });
check("convite não pode ser reutilizado por outra pessoa", !!reuse.error);
const wrong = await C.c.rpc("accept_invitation", { p_token_hash: mkToken().h });
check("token desconhecido é recusado", !!wrong.error);

const tTask = await A.c.from("tasks").insert({ workspace_id: TW, title: "Tarefa da equipe", created_by: A.id }).select("id").single();
check("A cria tarefa no espaço de equipe", !tTask.error, tTask.error?.message);
const bSees = await B.c.from("tasks").select("id").eq("id", tTask.data?.id ?? "");
check("B (editor) vê tarefa da equipe", (bSees.data ?? []).length === 1);
const cSees = await C.c.from("tasks").select("id").eq("id", tTask.data?.id ?? "");
check("C (fora) não vê tarefa da equipe", (cSees.data ?? []).length === 0);
const asg = await A.c.from("tasks").update({ assignee_id: B.id }).eq("id", tTask.data?.id ?? "");
check("atribuir a membro é aceito", !asg.error, asg.error?.message);
const asgOut = await A.c.from("tasks").update({ assignee_id: C.id }).eq("id", tTask.data?.id ?? "");
check("atribuir a quem é de fora é recusado", !!asgOut.error);
const notif = await B.c.from("notifications").select("type").eq("user_id", B.id);
check("B recebeu notificação de atribuição", (notif.data ?? []).some((n) => n.type === "task_assigned"));

const cm = await B.c.from("comments").insert({ workspace_id: TW, entity_type: "task", entity_id: tTask.data?.id, author_id: B.id, body: "Olá equipe" }).select("id").single();
check("B comenta na tarefa", !cm.error, cm.error?.message);
const cOut = await C.c.from("comments").insert({ workspace_id: TW, entity_type: "task", entity_id: tTask.data?.id, author_id: C.id, body: "invasão" });
check("C não comenta em espaço alheio", !!cOut.error);
const aNotif = await A.c.from("notifications").select("type").eq("user_id", A.id);
check("A recebeu notificação do comentário", (aNotif.data ?? []).some((n) => n.type === "comment"));
const forge = await B.c.from("notifications").update({ payload: { forjado: true } }).eq("user_id", B.id).select();
check("notificação é imutável (exceto leitura)", !!forge.error || (forge.data ?? []).length === 0);

const promote = await B.c.rpc("change_member_role", { p_workspace: TW, p_user: B.id, p_role: "owner" });
check("editor não se promove a dono", !!promote.error);
const rm = await A.c.rpc("remove_member", { p_workspace: TW, p_user: B.id });
check("dono remove membro", !rm.error, rm.error?.message);
const bAfter = await B.c.from("tasks").select("id").eq("id", tTask.data?.id ?? "");
check("membro removido perde acesso", (bAfter.data ?? []).length === 0);
const lastLeave = await A.c.rpc("leave_workspace", { p_workspace: TW });
check("último dono não consegue sair", !!lastLeave.error);

// 6. Etapa 7: portfólio não listado
const pj = await A.c.from("projects").insert({ workspace_id: A.ws, title: "Projeto público", created_by: A.id }).select("id").single();
const ptk = mkToken();
const pub = await A.c.rpc("publish_portfolio", { p_project: pj.data?.id, p_summary: "Resumo", p_token_hash: ptk.h });
check("publicar portfólio", !pub.error, pub.error?.message);
const ent = await A.c.from("portfolio_entries").select("id, slug").eq("project_id", pj.data?.id ?? "").single();
const open1 = await anon.rpc("get_public_portfolio", { p_slug: ent.data?.slug, p_token_hash: ptk.h });
check("visitante anônimo abre com slug + token", (open1.data ?? []).length === 1);
const open2 = await anon.rpc("get_public_portfolio", { p_slug: ent.data?.slug, p_token_hash: mkToken().h });
check("token errado não abre", (open2.data ?? []).length === 0);
const direct = await anon.from("portfolio_entries").select("id");
check("anônimo não lê a tabela", !!direct.error || (direct.data ?? []).length === 0);
const hashCol = await A.c.from("portfolio_entries").select("access_token_hash");
check("membro não lê o hash do token", !!hashCol.error);
const rv = await A.c.rpc("revoke_portfolio", { p_entry: ent.data?.id });
const open3 = await anon.rpc("get_public_portfolio", { p_slug: ent.data?.slug, p_token_hash: ptk.h });
check("link revogado fecha na hora", !rv.error && (open3.data ?? []).length === 0);

console.log(`\n${results.filter(Boolean).length}/${results.length} verificações passaram`);
console.log("Limpeza: apague os usuários orbita.*@example.com em Authentication → Users (cascata remove os dados).");
process.exit(results.every(Boolean) ? 0 : 1);
