#!/usr/bin/env node
// Verificação ponta a ponta no Supabase REAL, usando só a anon key (sem service role).
// Uso: node --env-file=.env.local scripts/verify-supabase.mjs
// Pré-requisito: migrações aplicadas e "Confirm email" DESATIVADO no projeto de DEV
// (Authentication → Providers → Email), para o signUp já devolver sessão.
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

console.log(`\n${results.filter(Boolean).length}/${results.length} verificações passaram`);
console.log("Limpeza: apague os usuários orbita.*@example.com em Authentication → Users (cascata remove os dados).");
process.exit(results.every(Boolean) ? 0 : 1);
