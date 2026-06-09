# Visual Refresh 2026 — scheduling-frontend

Relacionados: [[frontend/architecture|architecture]] · [[frontend/components|components]] · [[frontend/pages|pages]] · [[frontend/progress|progress]] · [[overview]]

> Implementação do design handoff `design_handoff_visual_refresh` — refresh completo da identidade visual. **Sem mudanças de funcionalidade, contrato de API ou navegação.** Apenas estilos, tipografia, espaçamento, componentes visuais e microinterações.

---

## Fonte de verdade

- Design reference: `C:\Users\Usuario\Downloads\Agendamento\design_handoff_visual_refresh\`
- README do handoff: `design_handoff_visual_refresh/README.md`
- Tokens CSS de origem: `design_handoff_visual_refresh/design-reference/tokens.css`

---

## O que foi implementado

### 1. Fundação — tokens CSS e fontes

**Arquivo:** `src/index.css`
- Substituído o `@import "tailwindcss"` pelo conteúdo integral de `tokens.css`
- Tema escuro como padrão; suporte a tema claro via `:root.light`
- Fonte Manrope (display + body) + JetBrains Mono carregadas via Google Fonts no `index.html`
- Classes utilitárias globais: `.h-display`, `.h-page`, `.h-section`, `.h-card`, `.text-body`, `.text-meta`, `.text-tag`, `.text-mono`, `.num-display`
- Layout: `.app` (grid 248px + 1fr), `.main-col`, `.page` (padding 28/36/80, max-width 1480px)
- Componentes CSS: `.card`, `.btn`, `.badge`, `.input`, `.tabs`, `.tab`, `.day-pill`, `.slot`, `.switch`, `.divider`, `.divider-v`, `.metrics`, `.metric`, `.cal`, `.cal-cell`, `.pending-row`, `.row`, `.modal`, `.modal-overlay`, `.empty`, `.loading`, `.pagination`, `.alert-error`, `.alert-success`, `.setting-row`

**Arquivo:** `index.html`
- Adicionado `<link>` Google Fonts: Manrope (400/500/600/700/800) + JetBrains Mono (400/500)
- `lang="pt-BR"`, título `Agendamento`

### 2. Sidebar — `src/components/Sidebar.tsx`

- Estrutura: `.side` / `.side-brand` / `.side-logo` / `.nav-item`
- Logo SVG de calendário com gradiente accent (32×32)
- Itens de nav: Visão geral · Horários · Pendentes · Agendamentos · Usuários · Configurações
- Seções rotuladas ("OPERAÇÃO", "ADMINISTRAÇÃO") em `.side-section`
- `NavLink` com classe `active` → barra vertical accent (::before)
- Badge numérico em "Pendentes" lendo de `usePendingAppointments` (polling 30s)
- Footer: `Avatar` (initials) + nome/email + botão sair com `<LogOut>`
- Ícones: `lucide-react` (`LayoutGrid`, `Clock`, `Hourglass`, `Calendar`, `Users`, `Settings`, `LogOut`)

### 3. DashboardLayout — `src/pages/dashboard/DashboardLayout.tsx`

- Layout grid `.app` (248px sidebar + flex main)
- Topbar: `.topbar` / `.crumbs` (breadcrumb com ícone empresa + nome + "/" + página atual)
- Breadcrumb derivado do `useLocation` mapeando o último segmento da URL
- Search pill (`.search`) com ícone `<Search>` + placeholder + kbd `⌘ K`
- Bell icon-button com `.notify-dot` accent
- Company pill (`.company-pill`) com avatar gradiente (iniciais) + nome + role sub-rótulo + `<ChevronDown>`
- Ícones: `Building2`, `Search`, `Bell`, `ChevronDown`

### 4. Componentes de charts

**`src/components/charts/Sparkline.tsx`**
- Sparkline SVG (polyline + dot final) — props: `data[]`, `w=80`, `h=28`, `color`

**`src/components/charts/Donut.tsx`**
- Anel Donut SVG (dois circles, `strokeDashoffset`) — props: `pct`, `size=52`, `stroke=4`, `color`

### 5. CalendarView — `src/components/CalendarView.tsx`

- Grid `.cal` com 7px gutter inicial + 7 colunas
- Cabeçalhos de dias da semana (`.cal-head`)
- Células (`.cal-cell`) com classes `.dim` / `.today` / `.selected`
- Barras de disponibilidade (`.bar.avail`, `.bar.partial`, `.bar.full`) geradas a partir do `status` do backend
- Header com nome do mês e botões ChevronLeft/ChevronRight
- Legenda colorida abaixo do grid
- Ícones: `ChevronLeft`, `ChevronRight`

### 6. PendingList — `src/components/PendingList.tsx`

- Estrutura `.card .card-pad` com `.card-hd`
- Linhas `.pending-row` (grid: 36px avatar / 1fr info / auto ações)
- Avatar `.av-sm` quadrado (border-radius 10) com iniciais
- Ícones `<Check>` accent e `<X>` danger nos icon-buttons

### 7. SlotPanel — `src/components/SlotPanel.tsx`

- Estrutura `.card .card-pad`
- Grid `.slots` com botões `.slot` (classes `.taken` / `.selected`)
- Modal `AppointmentModal` com overlay `.modal-overlay` / `.modal`
- Abas "Buscar cliente" / "Criar cliente" via `.tabs .tab`
- Search com dropdown inline estilizado com tokens
- Formulário com classes `.input` e `.field`
- Ícones: `X`, `Search`, `Check`

### 8. DashboardHome — `src/pages/dashboard/DashboardHome.tsx`

- Header com saudação (`.h-display`) + ícone `<Hand>` accent
- Grid `.metrics` (4 colunas) com componente `MetricCard`:
  - "Hoje" — spark, trend up
  - "Pendentes" — spark warn + classe `.accent`
  - "Mês atual" — spark
  - "Taxa de confirmação" — `<Donut>` component
- Grid `1.7fr / 1fr`:
  - Esquerda: `<CalendarView>` + `<SlotPanel>` (condicional)
  - Direita: card "Próximo agendamento" + `<PendingList>`
- Métricas calculadas das queries existentes (sem mudança de lógica)

### 9. SchedulesPage — `src/pages/dashboard/SchedulesPage.tsx`

- Tabs "Profissional" / "Bloqueios" (`.tabs .tab`)
- Cards por grupo de grade: day-pills (`.day-pill.on`) + colunas info + ações
- Formulários inline em `FormCard` (`.card .card-pad` + cabeçalho com `<X>`)
- Inputs com `inputStyle` (tokens CSS em linha)
- Bloqueios na aba "Bloqueios": `.row` com badge `.st-cancelled`
- Ícones: `Plus`, `Lock`, `Pencil`, `Trash2`, `X`

### 10. PendingPage — `src/pages/dashboard/PendingPage.tsx`

- Cards grandes com avatar 44px (border-radius 12)
- Badge `.badge.st-pending`
- Meta row com dividers verticais (`.divider-v`): Quando / Duração / Profissional
- Nota em bloco amber translúcido (itálico)
- 3 ações: btn-primary Confirmar / btn-danger Recusar / id numérico abaixo
- Empty state `.empty` com ✓
- Ícones: `Check`, `X`, `Mail`, `Phone`

### 11. AppointmentsPage — `src/pages/dashboard/AppointmentsPage.tsx`

- Header com navegação de mês (ChevronLeft/Right) + botão Novo
- Search pill + tabs de status (5 abas)
- Lista agrupada por data com label `.text-tag` + linha + contagem
- Rows `.row` (grid: 70px tempo / 36px avatar / 1fr info / badge / ações)
- Status badges via `.badge .st-*`
- Paginação com `.pagination`
- Mantidos modais `RescheduleModal` e `AppointmentDetailModal` (sem estilos alterados neles ainda)
- Ícones: `ChevronLeft`, `ChevronRight`, `Search`, `Plus`, `MoreHorizontal`, `Check`, `X`

### 12. UsersPage — `src/pages/dashboard/UsersPage.tsx`

- Header + botão "Criar Manager"
- Search pill + tabs de role (4 abas)
- Toggle mostrar/ocultar inativos
- Rows `.row` (grid: 40px avatar / 1.4fr nome+role / 1.4fr empresa / 1fr contato / auto ações)
- Badges de role: `.badge.role-admin`, `.badge.role-manager`, `.badge.role-client`
- Confirmação inline de desativação
- Modal "Criar Manager" com `.modal-overlay .modal`
- Modal "Vincular empresa" 
- Ícones: `Plus`, `Mail`, `Building2`, `Phone`, `MoreHorizontal`, `X`

### 13. CompanySettingsPage — `src/pages/dashboard/CompanySettingsPage.tsx`

- Grid 2 colunas de `SettingCard`s
- Identidade: preview logo + upload
- Link de agendamento: URL mono + Copy button com feedback "Copiado!" + Switch
- Informações gerais: grid 2×2 de `<input className="input">`
- Status: Switch funcional (salva via `updateCompanySettings`)
- Zona de risco: borda danger + botão btn-danger
- Componentes internos: `SettingCard`, `Switch`, `SettingRow`
- Ícones: `Copy`, `Lock`

---

## Nova dependência adicionada

```json
"lucide-react": "^x.x.x"
```

Instalado via `npm install lucide-react`. Não viola o princípio "sem libs pesadas" — é tree-shakeable e puramente de ícones SVG.

---

### 14. LoginPage — `src/pages/auth/LoginPage.tsx`

- Layout centralizado full-screen (sem sidebar)
- `BrandMark` SVG inline com gradiente accent (40×40, `brand-grad`)
- Card `.card .card-pad` com `max-width: 420px`
- Campos `.input` via `.field`, label + error inline
- Link "Esqueceu a senha?" ao lado do label de Senha (cor `var(--accent)`)
- Botão `btn btn-primary` full-width
- Rodapé com link para `/register` em `var(--accent)`
- Zero classes Tailwind

### 15. RegisterPage — `src/pages/auth/RegisterPage.tsx`

- Mesma estrutura de layout e brand que `LoginPage`
- `BrandMark` com ID distinto (`brand-grad-r`) para evitar conflito de `linearGradient`
- 5 campos: nome, e-mail, telefone (opcional), senha, confirmar senha
- Telefone sem validação de erro (campo opcional)
- Rodapé com link para `/login`
- Zero classes Tailwind

### 16. BookingPage — `src/pages/booking/BookingPage.tsx`

- `BookingErrorScreen` recebe `icon: React.ReactNode` — usa `AlertCircle`, `Building2`, `Lock` de `lucide-react`
- Header escuro (`.surface-1`) com logo/initials + nome + endereço + telefone (tel: link)
- Step indicator: círculo accent ativo, check para concluídos, `surface-3` para futuros
- **Step 1 (calendário):** `.cal-cell` grid 7 colunas; `.cal-head` para nomes dos dias; dot de status embutido; extraStyle inline para estados `partial` (warning) e `full` (danger/disabled); legenda com pontos coloridos
- **Step 2 (slots):** back button `ChevronLeft`, `.slot` / `.slot.taken` grid auto-fill; estado vazio via `.empty`
- **Step 3 (formulário):** summary box com fundo `color-mix(accent 8%)` + borda accent; campos `.input` / `.field`; `textarea` com `.input` e `resize: none`
- **Step 4 (sucesso):** ícone `Check` em círculo accent; detalhes em `surface-2`; dois botões `btn-ghost`
- Ícones: `ChevronLeft`, `ChevronRight`, `Building2`, `Check`, `Lock`, `AlertCircle`
- Zero classes Tailwind

---

### 17. SetupCompanyPage — `src/pages/setup/SetupCompanyPage.tsx`

- Layout centralizado full-screen idêntico ao Login/Register
- Card `.card .card-pad` com `max-width: 480px`
- 4 campos: nome*, descrição (textarea `resize: none`), endereço, telefone
- `.btn .btn-primary` full-width; `.alert-error` para erros
- Zero classes Tailwind

### 18. AppointmentDetailModal — `src/components/AppointmentDetailModal.tsx`

- `.modal-overlay .modal` com `max-width: 440px`
- `.badge .st-*` para status no header
- Componente `InfoRow` interno com ícone lucide (`Clock`, `Building2`, `User`, `UserCircle`, `MessageSquare`) + `.text-tag` + valor
- Notas com fundo warning translúcido + itálico
- Botão fechar: `btn-ghost btn-sm btn-icon` com `X` de lucide
- Zero classes Tailwind

### 19. RescheduleModal — `src/components/RescheduleModal.tsx`

- `.modal-overlay .modal` com `max-height: 90vh; display: flex; flex-direction: column`
- Header fixo, body com `flex: 1; overflow-y: auto`, footer fixo
- Summary do agendamento atual em `surface-2`
- Date input com `.input`
- Slots agrupados por profissional; botões `.slot .slot.selected`
- Summary do novo horário com fundo accent translúcido
- Botões Cancelar (`btn-ghost`) e Confirmar (`btn-primary`) no footer
- Ícones: `X`, `User`
- Zero classes Tailwind

### 20. MyAppointmentsPage — `src/pages/client/MyAppointmentsPage.tsx`

- Header escuro `surface-1` com título, link "Editar perfil" (accent), botões `btn-primary btn-sm` e `btn-ghost btn-icon` (LogOut)
- Card "Próximo agendamento" com fundo `color-mix(accent 10%, surface-1)` + borda accent translúcida
- `.tabs .tab` para filtros (5 abas com contagem entre parênteses)
- Cards `.card` com grid: data/hora + badge status, detalhes (Building2/User/MessageSquare icons), cancel inline, footer #id + "Ver detalhes"
- Cancel inline: fundo danger translúcido + botões `btn-danger btn-sm` / `btn-ghost btn-sm`
- `.pagination` para navegação de páginas
- Modal de clínicas: `.modal-overlay .modal`; cards clicáveis com MapPin + Phone icons; empty state com Building2
- Ícones: `Plus`, `LogOut`, `X`, `Building2`, `User`, `MessageSquare`, `MapPin`, `Phone`
- Zero classes Tailwind

---

## ✅ Migração Tailwind → Tokens CSS — COMPLETA

Todos os arquivos `.tsx` foram portados. Tailwind foi removido do projeto:
- `tailwindcss` e `@tailwindcss/vite` desinstalados do `package.json`
- Plugin `tailwindcss()` removido do `vite.config.ts`
- Zero ocorrências de classes Tailwind (verificado via `tsc --noEmit` + grep)

### Como portar cada página restante

1. Remover todas as classes Tailwind (`className="..."` com prefixos como `bg-`, `text-`, `flex-`, `rounded-`, etc.)
2. Substituir por classes do sistema de tokens (`btn`, `card`, `input`, `badge`, `text-meta`, etc.) ou inline styles com variáveis CSS
3. Substituir emojis por ícones `lucide-react` equivalentes
4. Usar `.modal-overlay / .modal` para modais

### Tailwind: status de remoção

O plugin `@tailwindcss/vite` ainda está em `vite.config.ts`. Uma vez que **todas** as páginas/componentes tenham sido portados, remover:
- A linha `import tailwindcss from '@tailwindcss/vite'` do `vite.config.ts`
- A linha `tailwindcss()` do array `plugins`
- A dependência `tailwindcss` e `@tailwindcss/vite` do `package.json`

---

## Paleta de tokens (resumo)

| Token | Valor |
|---|---|
| `--accent` | `#69d3a7` (mint) |
| `--bg` | `#0a0e0c` (canvas dark) |
| `--surface-1` | `#131a18` (cards) |
| `--surface-2` | `#181f1c` (inputs, cards aninhados) |
| `--surface-3` | `#1f2724` (badges numéricos, hover profundo) |
| `--ink` | `#ecf1ee` (texto primário) |
| `--ink-2` | `#c1c9c4` (texto secundário) |
| `--ink-3` | `#8a948f` (texto meta) |
| `--danger` | `#ef6b6b` |
| `--warning` | `#e9b96b` |
| `--info` | `#7aa9ff` |

---

## Checklist de aceitação

- [x] Fontes Manrope + JetBrains Mono carregadas via Google Fonts
- [x] Tokens CSS em `src/index.css` aplicados globalmente
- [x] Tema dark é o padrão
- [x] Sidebar com brand, 6 itens de nav, badge num em pendentes, footer com avatar+logout
- [x] Topbar com breadcrumb, search com `⌘ K`, bell com notify-dot, company-pill
- [x] DashboardHome: 4 métricas (1 accent/warn, 1 com donut), calendário com barras, slot grid, pendentes
- [x] SchedulesPage: cards de grade horizontais, day-pills, abas Profissional/Bloqueios
- [x] PendingPage: cards grandes com 3 ações verticais
- [x] AppointmentsPage: tabs por status, grupos por data, status badges
- [x] UsersPage: tabs por role, ações contextuais, modais
- [x] CompanySettingsPage: grid 2 colunas, switches funcionais, copy button
- [x] Ícones via lucide-react (sem emojis nas páginas atualizadas)
- [x] Sem libs novas pesadas (apenas lucide-react para ícones)
- [x] Comportamento e API: nada alterado
- [x] LoginPage portada (card centralizado, brand SVG, tokens CSS)
- [x] RegisterPage portada (mesma estrutura de Login, 5 campos)
- [x] BookingPage portada (header escuro, calendar cal-cell, slot grid, success screen)
- [x] SetupCompanyPage portada (card centralizado, 4 campos, textarea resize:none)
- [x] AppointmentDetailModal portado (.modal-overlay .modal, InfoRow com lucide icons, badge st-*)
- [x] RescheduleModal portado (.modal-overlay .modal, slots grid, footer fixo, flex 90vh)
- [x] MyAppointmentsPage portada (header escuro, próximo agendamento accent, tabs, cards, modal clínicas)
- [x] NoCompanyPage portada (Building2 icon, card centralizado, link criar empresa para ADMIN)
- [x] ProfilePage portada (header com back button, avatar gradient com iniciais, badge role-*)
- [x] ForgotPasswordPage portada (Mail icon no sent state, ArrowLeft link)
- [x] ResetPasswordPage portada (Check/AlertCircle/ArrowRight icons, 3 estados)
- [x] DashboardPage (placeholder) portado (tokens h-page/text-meta)
- [x] router/index.tsx — rota /unauthorized portada com inline style tokens
- [x] Tailwind removido: `@tailwindcss/vite` e `tailwindcss` desinstalados; plugin removido do `vite.config.ts`
