# ÓRBITA — Etapa 2: Design

Protótipo navegável e especificação do design system da ÓRBITA. Tudo aqui é **estático**: HTML, CSS e um único JavaScript de demonstração. Não há build, dependências, autenticação, banco ou persistência.

## Como abrir

1. Abra `design/index.html` no navegador (duplo clique já funciona).
2. Se preferir servir por HTTP, use qualquer servidor estático na pasta `design/`.
3. Comece pelo índice, depois siga para **Visão geral** e **Mobile**.

As telas funcionam em desktop (1280 px ou mais) e em 390 px, com os mesmos arquivos. O layout responde à largura; não existem duas versões de código.

## Princípios de produto aplicados

| Princípio | Como aparece |
|---|---|
| Uma coisa importante por vez | “Meu foco” mostra um projeto principal e um curso principal por workspace. |
| Sempre existe um próximo passo | O cartão “Seu próximo passo” aparece na visão geral, no foco e no detalhe do projeto. |
| Nada é apagado por acidente | Troca de foco explica que o anterior volta ao backlog; arquivar pergunta o que fazer com tarefas abertas; exclusão vai para a lixeira. |
| Sem jargão de método | “Ideias”, “Próximo passo”, “Voltar ao backlog” e “Em andamento” em vez de épicos, sprints e cerimônias. |
| Estado nunca só por cor | Todo status tem ícone e rótulo: “Atrasada · ontem”, “Vence hoje”, “Sem prazo”. |
| Progresso transparente | Barra + “8 de 13 tarefas” + “62%”, nunca apenas a barra. |
| Mobile primeiro no toque | Alvos principais de 44 × 44 px, navegação inferior fixa e criação sempre ao alcance. |

## Tokens

### Cores — tema claro

| Token | Valor | Uso |
|---|---|---|
| `--night` | `#14213D` | Marca escura, texto sobre âmbar |
| `--brand` | `#2F6FE0` | Ações primárias, links, foco |
| `--brand-hover` | `#2457BC` | Hover do primário e do FAB |
| `--brand-700` | `#2A63D1` | Texto/ícone sobre `brand-050` |
| `--brand-050` | `#EAF1FE` | Fundos de destaque suave |
| `--success` | `#189B85` | Concluído, progresso |
| `--success-700` | `#16796A` | Texto sobre `success-050` |
| `--warning` | `#F2B84B` | Atenção; sempre com texto escuro |
| `--warning-700` | `#8A5E05` | Texto sobre `warning-050` |
| `--danger` | `#C93D34` | Erro, atraso, exclusão |
| `--danger-700` | `#B0342B` | Texto sobre `danger-050` |
| `--bg` | `#F6F8FC` | Fundo do app |
| `--surface` | `#FFFFFF` | Cartões, barras |
| `--border` | `#E4E9F2` | Divisórias e contornos |
| `--text` | `#182230` | Texto principal |
| `--text-muted` | `#5A6578` | Texto secundário |
| `--text-faint` | `#677286` | Metadados e placeholders |
| `--sidebar-bg` | `#101827` | Navegação lateral |

O tema escuro troca superfícies e textos, e usa versões claras dos “inks” (`--brand-700`, `--success-700`, `--warning-700`, `--danger-700`) para manter contraste sobre os fundos escuros.

### Contraste verificado (WCAG AA)

| Par | Claro | Escuro | Mínimo |
|---|---|---|---|
| Texto principal / fundo | 15,1:1 | 15,9:1 | 4,5:1 |
| Texto secundário / cartão | 5,9:1 | 6,5:1 | 4,5:1 |
| Texto fraco / cartão | 4,9:1 | 5,3:1 | 4,5:1 |
| Branco / botão primário | 4,7:1 | 4,7:1 | 4,5:1 |
| Branco / botão de perigo | 5,0:1 | 5,0:1 | 4,5:1 |
| Chip de marca | 4,9:1 | 7,9:1 | 4,5:1 |
| Chip de sucesso | 4,8:1 | 8,6:1 | 4,5:1 |
| Chip de atenção | 5,2:1 | 8,9:1 | 4,5:1 |
| Chip de perigo | 5,5:1 | 7,6:1 | 4,5:1 |
| Ícone branco / sucesso | 3,5:1 | 3,5:1 | 3:1 |

### Tipografia

Inter (fallback para a fonte do sistema). Números tabulares em prazos e progresso.

| Papel | Tamanho / peso |
|---|---|
| Título de página (`h1`) | 24 px / 650 |
| Título de seção (`h2`) | 18 px / 600 |
| Título de cartão (`h3`) | 15 px / 600 |
| Corpo e listas | 14 px / 400 |
| Interface densa (botões, tarefas) | 13,5 px / 400–600 |
| Auxiliar e metadados | 11,5–12,5 px / 400–600 |

### Espaçamento, forma e sombra

- Escala: 4, 8, 12, 16, 24, 32 e 48 px (`--space-1` a `--space-7`).
- Raios: 8 px (`sm`), 12 px (`md`), 16 px (`lg`), 999 px (`full`).
- Sombras: três níveis (`--shadow-1` a `--shadow-3`), usadas para elevar cartões, modais e o FAB.
- Foco visível: anel de 2 px na cor da marca, com contraste mínimo de 3:1.

## Componentes

| Componente | Onde ver | Observações |
|---|---|---|
| Botões | `index.html` | Primário, secundário, discreto, perigo, ícone. 38 px no desktop; 44 px no celular. |
| Chips e status | todas as telas | Sempre com texto; cor é reforço, nunca a única informação. |
| Cartões | `projetos.html`, `dashboard.html` | Superfície primária do produto; hierarquia por título, meta e ação. |
| Linhas de tarefa | `dashboard.html`, `tarefas.html` | Conclusão em um toque, metadados em linha e prazo explícito. |
| Barra de progresso | `dashboard.html`, `projeto.html` | Sempre acompanhada de “X de Y” e porcentagem. |
| Abas | `criar.html`, `projeto.html` | Ativadas por clique e por hash da URL (`#historico`). |
| Kanban | `projetos.html`, `tarefas.html` | Arrastar e soltar com contagem por coluna; no celular, rolagem horizontal com encaixe. |
| Formulários | `criar.html`, `espacos.html` | Rótulo sempre visível, dica abaixo do campo, erro junto ao campo. |
| Modal | `foco.html`, `backlog.html` | Fecha com Escape, restaura o foco e mantém o Tab dentro do diálogo. |
| Toast | qualquer ação de demonstração | Mensagem curta com “Desfazer” quando a ação pode ser revertida. |
| Upload | `arquivos.html` | Estados de enviando, enviado, falhou, retry e rejeitado por limite. |
| Navegação inferior | qualquer tela em 390 px | Cinco destinos; “Mais” abre o restante. |
| FAB | telas móveis | Criar sempre visível, acima da barra inferior. |

## Comportamento no celular

- Ponto de quebra único em **980 px**: sidebar some, topbar compacta, navegação inferior e FAB aparecem.
- Conteúdo em uma coluna; cartões e Kanban usam `minmax(0, 1fr)` para não estourar a largura.
- Tabelas de membros e de projetos viram cartões empilhados com rótulos (`data-label`), preservando a semântica de tabela por ARIA.
- Formulários ocupam a tela; o botão principal fica no rodapé, acima do teclado.
- Alvos principais: 44 × 44 px. A conclusão de tarefa tem área de toque ampliada para 44 px sem aumentar o círculo visual.

## Estrutura de arquivos

```text
design/
├── index.html            # índice, paleta, tipografia e checklist de aprovação
├── dashboard.html        # visão geral desktop
├── foco.html             # foco + confirmação de troca
├── projetos.html         # cartões, lista e Kanban
├── tarefas.html          # filtros, lista e Kanban de tarefas
├── criar.html            # projeto em 3 passos, tarefa rápida, ideia
├── backlog.html          # captura e conversão de ideias
├── arquivos.html         # upload, progresso, erro e cota
├── espacos.html          # membros, papéis, convites e link
├── projeto.html          # detalhe com abas, riscos e histórico
├── cursos.html           # curso principal e fila de estudos
├── portfolio.html        # privado, link não listado e revogação
├── configuracoes.html    # perfil, aparência, notificações e LGPD
├── mobile.html           # molduras de 390 px com telas reais
└── assets/
    ├── app.css           # tokens, layout e componentes
    └── app.js            # ícones, tema, abas, modais, Kanban, toast
```

## Decisões já fechadas que o design respeita

- Um projeto principal e um curso principal **por workspace**, com confirmação na troca.
- Convites e múltiplos membros fazem parte do MVP.
- Portfólio privado por padrão; link público não listado, com token, `noindex` e revogação.
- Limites de arquivo: 25 MB por arquivo e 1 GB por workspace.
- Netlify como hospedagem, precedida de um spike de compatibilidade de 1 dia; Vercel como alternativa.
- Datas em UTC no banco e exibição no fuso do usuário.
- Soft delete, lixeira e arquivamento com decisão explícita sobre tarefas abertas.

## Limitações deste protótipo

- Dados fixos de exemplo; nada é salvo ou enviado.
- Sem login, banco, storage ou regras de autorização reais.
- O wizard de projeto mostra o primeiro passo; os passos 2 e 3 serão implementados na Etapa 3.
- O link de convite e o link do portfólio são simulados; copiar mostra apenas um toast.
- A instalação como PWA, o service worker e o comportamento offline serão validados na Etapa 3.

## Checklist de aprovação

Antes de iniciar a Etapa 3, confirme:

1. **Hierarquia** — a visão geral responde onde estou, o que fazer e qual é o próximo passo.
2. **Linguagem** — “Meu foco”, “Próximo passo” e “Voltar ao backlog” funcionam para quem nunca usou Kanban.
3. **Densidade** — desktop e celular estão confortáveis de ler e tocar.
4. **Troca de foco** — fica claro que nada é apagado e que a mudança fica no histórico.
5. **Upload** — progresso, erro, retry e limite de 25 MB são compreensíveis.
6. **Convites** — fica claro que o convite só vale após o aceite e que o link expira.
7. **Mobile** — barra inferior, FAB e confirmações funcionam em 390 px.

Se algo não estiver aprovado, a Etapa 3 não começa: o ajuste é feito aqui, no design, antes de existir código de aplicação.
