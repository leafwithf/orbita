# ADR 0003 — Foco principal por escopo

- **Status:** aceito
- **Data:** 2026-11-14
- **Contexto da etapa:** Etapa 3 — Fundação

## Contexto

Uma das regras centrais do ÓRBITA é “um projeto principal e um curso principal por escopo configurado”. Trocar o foco não pode apagar, arquivar ou esconder o item anterior: ele volta para a lista, com tarefas e notas intactas. A regra precisa valer mesmo com duas abas abertas ou duas pessoas clicando ao mesmo tempo.

Guardar um booleano `is_primary` em `projects`/`courses` permitiria dois registros principais por erro de concorrência e exigiria varreduras para limpar o anterior.

## Decisão

Criar a tabela `focus_assignments`:

```sql
create table public.focus_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind public.focus_kind not null,
  scope_key text not null,
  target_id uuid not null,
  set_by uuid not null references public.profiles (id) on delete cascade,
  set_at timestamptz not null default now(),
  constraint focus_unique unique (workspace_id, kind, scope_key)
);
```

- `kind` é `project` ou `course`.
- `scope_key` é `'workspace'` quando o espaço usa foco compartilhado, ou o id do usuário quando o espaço usa foco individual (`workspaces.focus_scope`).
- A unicidade `(workspace_id, kind, scope_key)` é a garantia final contra duplicidade.
- A troca acontece pela RPC `set_primary_focus(p_workspace, p_kind, p_target)`, que:
  1. valida que o alvo pertence ao espaço e não está excluído;
  2. trava a linha de escopo com `select ... for update`;
  3. faz `insert ... on conflict ... do update`;
  4. registra a troca no histórico.
- Um trigger valida que `target_id` existe e pertence ao workspace antes de gravar.
- A UI sempre pede confirmação ao trocar e explica que nada será arquivado ou apagado.

## Consequências

**Positivas**

- A regra é imposta pelo banco, não apenas pela interface.
- A troca é atômica e segura sob concorrência.
- O histórico de foco é auditável.
- O mesmo modelo serve para foco compartilhado e individual sem duplicar tabelas.

**Negativas**

- `target_id` é polimórfico (aponta para `projects` ou `courses`), então a integridade referencial é garantida por trigger, não por foreign key.
- Consultas de foco precisam considerar `scope_key`.
- A RPC é o único caminho de escrita; código que tente inserir direto pode esbarrar nas validações. Isso é intencional.

## Alternativas consideradas

- **Booleano `is_primary`:** simples, mas sujeito a duplicidade e a updates em massa.
- **Duas colunas em `workspaces`:** não acomoda foco individual por usuário e dificulta o histórico.
- **Tabela por tipo (`focus_projects`, `focus_courses`):** duplica regras de unicidade e RPCs.
