# Move Map — Family Route Line Visual Spec

> Visual spec for transforming RouteLine into the "Family Route Line" (Malden → Barcelona, January 2027). Target: Chizul implementation. Source docs: `move-map-polish-plan.md`, `visual-direction.md`.

---

## 1. Layout

| Breakpoint | Orientation | Container | Landmark Flow |
|------------|-------------|-----------|---------------|
| **Desktop** (≥1024px) | Horizontal | Full-width, max-width 1200px, centered | Left → Right: Malden → Landmarks 1–8 → Barcelona |
| **Mobile** (<1024px) | Vertical | Full-width, 16px side padding | Top → Bottom: Malden → Landmarks 1–8 → Barcelona |

- Container: `max-width: var(--max-width, 1200px); margin: 0 auto; padding: var(--space-lg) var(--space-md);`
- Landmarks evenly distributed along the route line (flex `space-between` on desktop` / flex-column `gap` mobile)
- **Desktop**: min-height ~120px; **Mobile**: full-height scroll, landmarks centered

---

## 2. Landmark Design

### 2.1 Landmark Data (from `roadmap_phases`)
| # | Key | Label | Phase Key (roadmap_phases) |
|---|-----|-------|----------------------------|
| 1 | `research` | Research | `research` |
| 2 | `visa` | Visa Path | `visa` |
| 3 | `budget` | Budget Confidence | `budget` |
| 4 | `documents` | Documents | `documents` |
| 5 | `housing` | Housing & Schools | `housing` |
| 6 | `travel` | Travel | `travel` |
| 7 | `arrival` | Arrival | `arrival` |
| 8 | `stabilization` | Stabilization | `stabilization` |

### 2.2 Visual Structure (per landmark)

```
┌─────────────────────────────────────────────────────┐
│  ● [Icon]          ← 32px landmark circle           │
│    Label            ← label below, centered         │
│    [Status Chip]    ← readiness chip (optional)     │
└─────────────────────────────────────────────────────┘
```

| Element | Desktop | Mobile |
|---------|---------|--------|
| Landmark circle | 32px diameter | 28px diameter |
| Icon inside | 18px (lucide icons) | 16px |
| Label | 13px, var(--font-sans), var(--text-muted) centered | 12px, centered |
| Status chip | 10px, var(--radius-pill), var(--text-xs) | 9px, var(--radius-pill) |

### 2.3 Icons (lucide-react names)
| Key | Icon | Fallback |
|-----|-----|---|---|
| research | `Search` | 🔍 |
| visa | `ShieldCheck` | 🛂 |
| budget | `PiggyBank` | 💰 |
| documents | `FileText` | 📄 |
| housing | `Home` | 🏠 |
| travel | `Plane` | ✈️ |
| arrival | `Flag` | 🏁 |
| stabilization | `Shield` | 🛡️ |

### 2.4 Readiness States (CSS classes on `.route-landmark`)
| State | Class | Circle Border | Icon Color | Label | Chip |
|-------|-------|---------------|------------|-------|------|
| **Future** | `.is-future` | `var(--color-clay) / 40%` dashed | `var(--color-text-muted)` | muted | — |
| **In Progress** | `.is-current` | `var(--color-route-blue)` solid, 3px | `var(--color-route-blue)` | var(--text-primary) | — |
| **Ready** | `.is-ready` | `var(--color-sage)` solid, 3px | `var(--color-sage)` | var(--text-primary) | ✓ Ready (sage chip) |
| **Blocked** | `.is-blocked` | `var(--color-coral)` solid, 3px | `var(--color-coral)` | var(--text-primary) | ⚠ Blocked (coral chip) |
| **Complete** | `.is-complete` | `var(--color-sage)` solid, 3px | `var(--color-sage)` | var(--text-muted) | ✓ Done (sage chip) |

> Colors from `visual-direction.md`: **route-blue** = Mediterranean blue, **clay** = terracotta/clay, **sage** = olive/sage, **coral** = muted coral.

---

## 3. Connecting Line

| Property | Value (CSS Var) |
|----------|-----------------|
| **Color** | `var(--color-route-blue)` (Mediterranean blue) |
| **Width** | 3px desktop / 2px mobile |
| **Style** | Solid |
| **Progress fill** | Animated gradient fill from Malden → current position |

### 3.1 Progress Fill Animation
```css
.route-line::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: var(--progress, 0%);
  background: linear-gradient(90deg, var(--color-sage), var(--color-sea-glass));
  border-radius: var(--radius-sm);
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```
- `--progress` CSS custom property: 0–100% based on current phase index / total phases
- **Desktop**: horizontal gradient (left → right)
- **Mobile**: vertical gradient (top → bottom)

### 3.2 Desktop vs Mobile Line Orientation
```css
/* Desktop */
.route-line { flex-direction: row; align-items: center; }
.route-line::before { height: 3px; width: var(--progress); }

/* Mobile */
@media (max-width: 1023px) {
  .route-line { flex-direction: column; align-items: center; }
  .route-line::before { width: 2px; height: var(--progress); }
}
```

---

## 4. Current Position Indicator

| Element | Spec |
|---------|------|
| **Element** | `.route-position` (pseudo-element on `.route-landmark.is-current`) |
| **Shape** | Pulsing ring: 44px outer, 32px inner (matches landmark circle) |
| **Color** | `var(--color-route-blue)` at 60% opacity |
| **Animation** | `pulse-ring 2s ease-out infinite` |

```css
@keyframes pulse-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  70%  { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}
.route-landmark.is-current::after {
  content: '';
  position: absolute;
  inset: -6px;
  border: 3px solid var(--color-route-blue);
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
  pointer-events: none;
}
```
- **Desktop**: centered on landmark circle
- **Mobile**: same, centered vertically

---

## 5. Destination Marker (Barcelona — January 2027)

```
┌────────────────────────────────────┐
│  🏁  Barcelona — January 2027      │  ← flag icon + label
│  [Route Line End]                  │
└────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| **Icon** | `Flag` (lucide), 20px desktop / 18px mobile |
| **Color** | `var(--color-route-blue)` |
| **Label** | "Barcelona — January 2027" |
| **Typography** | 14px desktop / 13px mobile, `var(--font-serif)`, `var(--color-route-blue)`, `font-weight: 500` |
| **Position** | End of route line (rightmost desktop, bottom mobile) |
| **Background** | `var(--color-warm-paper)` subtle pill, `var(--radius-pill)`, `var(--space-xs)` padding |

CSS:
```css
.route-destination {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-warm-paper);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-route-blue) / 20%;
}
.route-destination-icon { color: var(--color-route-blue); }
.route-destination-label { font-family: var(--font-serif); color: var(--color-route-blue); }
```

---

## 6. Color Usage (from `visual-direction.md`)

| Semantic Role | CSS Variable | Hex (ref) | Usage |
|---------------|--------------|-----------|-------|
| **Route Line** | `--color-route-blue` | `#2A6B8C` | Connecting line, current pulse, destination |
| **Future Landmarks** | `--color-clay` | `#C47A5C` | Dashed border for future landmarks |
| **Progress Fill** | `--color-sage` → `--color-sea-glass` | `#7A9E7E` → `#88C9B3` | Gradient fill on route line |
| **Blocked State** | `--color-coral` | `#E07A6D` | Blocked landmark border, chip |
| **Ready/Complete** | `--color-sage` | `#7A9E7E` | Ready/complete border, chip |
| **Text Primary** | `--color-text-primary` | `#2D2D2D` | Labels, current position |
| **Text Muted** | `--color-text-muted` | `#6B6B6B` | Future labels, completed labels |
| **Background** | `--color-warm-paper` | `#FDF8F3` | Destination pill, card backgrounds |

> All CSS variables defined in `styles.css` (see Design System section below).

---

## 7. Animation Specs

| Animation | Trigger | Duration | Easing | CSS |
|-----------|---------|----------|--------|-----|
| **Progress fill** | Mount / phase change | 1.2s | `cubic-bezier(0.4, 0, 0.2, 1)` | `transition: width/height` on `::before` |
| **Current pulse** | Always (on `.is-current`) | 2s | `ease-out` | `@keyframes pulse-ring` |
| **Landmark appear** | Mount (staggered) | 0.4s each | `ease-out` | `animation: fade-up 0.4s ease-out both;` delay `calc(var(--index) * 80ms)` |
| **Status change** | State transition | 0.3s | `ease` | `transition: border-color, color, background` |

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.route-landmark { animation: fade-up 0.4s ease-out both; }
```

---

## 8. Mobile vs Desktop Layout Differences

| Aspect | Desktop (≥1024px) | Mobile (<1024px) |
|--------|-------------------|------------------|
| **Flow** | Horizontal (flex-row) | Vertical (flex-col) |
| **Line** | Horizontal, 3px | Vertical, 2px |
| **Landmark gap** | `gap: var(--space-xl)` (flex: 1) | `gap: var(--space-lg)` fixed |
| **Label position** | Below circle | Right of circle (flex-row landmark) |
| **Landmark layout** | Column (circle → label → chip) | Row (circle → label+chip) |
| **Progress fill** | Width animate | Height animate |
| **Destination** | Right end, inline | Bottom, centered |
| **Container height** | ~120px fixed | Auto (scroll) |
| **Landmark circle** | 32px | 28px |

```css
/* Mobile landmark row layout */
@media (max-width: 1023px) {
  .route-landmark { flex-direction: row; align-items: center; gap: var(--space-sm); text-align: left; }
  .route-landmark-label { text-align: left; }
}
```

---

## 9. CSS Variable Reference (from existing design system)

```css
/* colors (visual-direction.md palette) */
:root {
  --color-warm-paper: #FDF8F3;
  --color-route-blue: #2A6B8C;       /* Mediterranean blue */
  --color-clay: #C47A5C;              /* Terracotta/clay */
  --color-sage: #7A9E7E;              /* Olive/sage */
  --color-sea-glass: #88C9B3;         /* Pale teal/sea glass */
  --color-amber: #D4A843;             /* Soft amber */
  --color-coral: #E07A6D;             /* Muted coral */
  --color-text-primary: #2D2D2D;
  --color-text-muted: #6B6B6B;
}

/* spacing */
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}

/* radius */
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-pill: 9999px;
}

/* typography */
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Merriweather', Georgia, serif;
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
}

/* transition */
:root {
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 10. Component Props (RouteLine.tsx)

```tsx
interface RouteLandmark {
  key: string;           // 'research', 'visa', etc.
  label: string;         // 'Research'
  icon: LucideIcon;      // Lucide icon component
  status: 'future' | 'current' | 'ready' | 'blocked' | 'complete';
  phaseIndex: number;    // 0-based index for progress calc
}

interface RouteLineProps {
  landmarks: RouteLandmark[];
  currentPhaseIndex: number;  // drives --progress & .is-current
  totalPhases: number;        // landmark count
  destinationLabel?: string;  // "Barcelona — January 2027"
}
```

- `currentPhaseIndex` drives `--progress` = `((currentPhaseIndex + 1) / totalPhases) * 100%`
- Landmark with `phaseIndex === currentPhaseIndex` gets `.is-current`
- `phaseIndex < currentPhaseIndex` → `.is-complete` (or `.is-ready` if phase done)
- `phaseIndex > currentPhaseIndex` → `.is-future`
- Optional `status` override for `.is-blocked` / `.is-ready`

---

## 11. Acceptance Checklist (for Chizul)

- [ ] RouteLine renders horizontal on desktop, vertical on mobile
- [ ] 8 landmarks render with correct icons/labels from `roadmap_phases`
- [ ] Connecting line draws between all landmarks
- [ ] Progress fill animates from Malden → current phase
- [ ] Current phase landmark pulses (blue ring, 2s loop)
- [ ] Destination marker shows "Barcelona — January 2027" with flag icon
- [ ] Color usage matches spec: route-blue line, clay future, sage progress, coral blocked
- [ ] All colors use CSS variables from design system
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Build passes (`npm run build`)
- [ ] Klerik visual approval