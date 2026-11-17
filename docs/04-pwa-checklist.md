# Checklist de PWA e arquivos em aparelho real (Etapa 5)

Estes itens **não dá para automatizar na nuvem** — precisam de um aparelho e de um HTTPS real (o preview do Netlify serve). Marque ao concluir e anote o modelo/versão.

## Instalação
- [ ] Android + Chrome: menu → "Instalar app" aparece; o ícone mantém a forma (maskable) e abre em tela cheia (`display: standalone`).
- [ ] iPhone + Safari: Compartilhar → "Adicionar à Tela de Início"; ícone `apple-icon` correto.
- [ ] Desktop Chrome/Edge: ícone de instalar na barra de endereço.
- [ ] Atalhos do ícone (Nova tarefa, Registrar ideia) abrem a tela certa.

## Offline e cache
- [ ] Modo avião → abrir o app instalado mostra `/offline`, nunca dados do espaço.
- [ ] DevTools → Application → Cache Storage: só estáticos (`/_next/static`, `/icons`, `/offline`). Nenhuma resposta de `/api/*`, nenhuma URL assinada do Storage.
- [ ] Depois de sair da conta, nada de dados do usuário permanece em cache.

## Arquivos no celular
- [ ] Escolher foto da galeria, tirar foto e escolher do app Arquivos.
- [ ] Enviar arquivo de **20 MB** em rede móvel: barra de progresso real, cancelar e "Tentar de novo" funcionam.
- [ ] Enviar `.exe` renomeado para `.png`: recusado ou "Em análise" (nunca "Pronto").
- [ ] Visualizar PDF/imagem abre em nova aba; `.zip`/`.docx` baixam como anexo.
- [ ] URL de leitura copiada deixa de funcionar após ~5 minutos.
- [ ] Excluir → aparece na Lixeira → Restaurar traz de volta.

## Lighthouse (desktop e mobile)
- [ ] Categoria PWA/instalável sem falhas; Acessibilidade ≥ 95; sem erro de console.
