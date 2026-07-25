# Neural Workspace v1.0 – Premium Visual Design Refresh

## Plan (Approved)

### Step 1: Theme Foundation — `frontend/src/index.css`
- [x] Rewrite dark theme tokens (bg: `#050505`, surface: `#0B0B0B`, cards: `#111111`, borders: `#202020`)
- [x] Rewrite light theme tokens (bg: white, cards: `#FAFAFA`, borders: `#E5E5E5`)
- [x] Remove all pink/maroon/rose color tokens
- [x] Add custom monochrome scrollbar styles
- [x] Simplify to Inter + system-ui fonts (remove Space Grotesk)
- [x] Refine glassmorphism utility classes (subtle blur, thin borders)
- [x] Remove liquid background animations (too flashy)
- [x] Remove marble/shimmer/pink gradient animations
- [x] Keep success/warning/error colors only
- [x] Monochrome shadows (no tinted shadows)

### Step 2: Core UI Components
- [x] `button.tsx` – Monochrome variants, rounded-xl, subtle hover scale(1.02)
- [x] `card.tsx` – Remove backdrop-blur, thin borders, subtle hover elevation
- [x] `input.tsx` – Thin borders, rounded-xl, monochrome focus ring
- [x] `textarea.tsx` – Same as input
- [x] `select.tsx` – Monochrome styling
- [x] `dialog.tsx` – Glass overlay, subtle backdrop blur, monochrome
- [x] `alert-dialog.tsx` – Glass content, monochrome
- [x] `badge.tsx` – Monochrome variants
- [x] `progress.tsx` – Monochrome gradient
- [x] `skeleton.tsx` – Softer monochrome animation
- [x] `scroll-area.tsx` – Thin rounded scrollbar thumb
- [x] `glass-card.tsx` – Refined monochrome glass
- [x] `dropdown-menu.tsx` – Glass popover, monochrome
- [x] `popover.tsx` – Glass content, monochrome
- [x] `tooltip.tsx` – Glass tooltip, monochrome
- [x] `switch.tsx` – Monochrome, foreground/80 for checked
- [x] `sheet.tsx` – Monochrome overlay
- [x] `command.tsx` – Glass dialog
- [x] `tabs.tsx` – Monochrome, rounded-xl tabs list
- [x] `separator.tsx` – Uses bg-border (already monochrome)
- [x] `spinner.tsx` – Uses text color (already monochrome)

### Step 3: Layout & Components
- [x] `layout.tsx` – Sidebar bg `#0B0B0B` (via `bg-sidebar`), monochrome active states, refined hover, removed liquid bg + radial gradient
- [x] `empty-state.tsx` – Improved typography/spacing, smaller icon
- [x] `loading-skeleton.tsx` – Uses skeleton-glass (already updated)
- [x] `background-job-manager.tsx` – Uses updated components
- [x] `job-status-badge.tsx` – Monochrome status colors
- [x] `App.tsx` – Toast styling (glass, monochrome border #FFF/0.08)
- [x] `theme-provider.tsx` – No visual changes needed

### Step 4: Pages (Visual Polish Only)
- [x] `dashboard.tsx` – Consistent spacing, monochrome status colors
- [x] `workspace.tsx` – Monochrome agent icon colors
- [x] `assistant.tsx` – Monochrome header icon
- [x] `planner.tsx` – Monochrome kanban columns, priority colors
- [x] `architecture.tsx` – Monochrome page icon
- [x] `docs-studio.tsx` – Monochrome page icon
- [x] `memory.tsx` – Monochrome category colors
- [x] `prompts.tsx` – Monochrome page icon
- [x] `settings.tsx` – Monochrome page icon
- [x] `workflow.tsx` – Monochrome stage colors, removed backdrop-blur

### Step 5: Verification
- [x] Run `pnpm lint` — 0 errors, pre-existing warnings only
- [x] Run `pnpm typecheck` — passed, no type errors
- [x] Run `pnpm build` — passed, built in 4.87s
- [x] Manual visual review of all pages

### Status: ✅ COMPLETE

All visual polish changes have been applied and verified successfully.
