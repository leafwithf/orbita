# ADR 0005 — PWA, offline e privacidade do cache

- **Status:** aceito
- **Data:** 2026-11-14
- **Contexto da etapa:** Etapa 3 — Fundação

## Contexto

O ÓRBITA deve ser instalável e abrir rápido no celular, mas os dados são privados e mudam com frequência. Um service worker que cacheia respostas autenticadas pode servir dados de outra conta no mesmo dispositivo, além de mostrar tarefas desatualizadas sem aviso.

## Decisão

O service worker (`public/sw.js`) segue uma política conservadora:

- **Pré-cache:** apenas `/offline`, ícones e o manifest.
- **Navegação:** sempre **network-first**. Sem conexão, mostra `/offline`.
- **Assets estáticos** (`/_next/static/`, `/icons/`, `/favicon.ico`, manifest): cache-first com preenchimento sob demanda.
- **Dados de workspace, HTML autenticado e respostas de API nunca entram no cache.**
- Versão do cache explícita (`orbita-v1`); ao ativar uma versão nova, caches antigos são removidos.
- Registro do service worker apenas em produção, para não interferir no hot reload.
- `sw.js` é servido com `Cache-Control: max-age=0, must-revalidate` e `Service-Worker-Allowed: /`.
- O manifest declara ícones `any` e `maskable`, atalhos para criar tarefa e ideia, `display: standalone` e idioma `pt-BR`.

A página `/offline` explica que nada foi enviado, que os dados continuam no servidor e que a instalação não baixa o workspace para o dispositivo.

## Consequências

**Positivas**

- Instalação e abertura rápida sem risco de vazamento entre contas no mesmo aparelho.
- Comportamento previsível: sem rede, o usuário vê uma explicação em vez de uma tela quebrada.
- Sem sincronização offline complexa no MVP, o que reduz muito a superfície de bugs.

**Negativas**

- Não há edição offline. Isso é uma exclusão consciente do MVP.
- O app depende de rede para qualquer dado real.
- Atualizações do service worker exigem versionamento cuidadoso para não prender uma versão antiga.

## Quando revisitar

- Se o produto precisar de captura offline de ideias/tarefas. Nesse caso, será necessário um modelo de fila local, resolução de conflitos e criptografia no dispositivo — uma decisão arquitetural nova.
- Se o cache estático crescer a ponto de precisar de estratégia de expiração.
