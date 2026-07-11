# Move Map Visual Polish Plan

## Current State Analysis

### HomeView.tsx (Route Map Section - lines 122-150)
- Uses `RouteLine` component with `data.roadmap_phases`
- Displays phase cards in a `dashboard-split` grid
- Each phase shows: title, dates, description, progress bar, next milestone

### RouteLine.tsx (app/src/components/RouteLine.tsx)
- Simple vertical list with numbered markers (1, 2, 3...)
- Each stop shows: number marker, title, status pill
- No connecting line between stops
- No visual representation of the journey from Malden → Barcelona
- No landmarks/phases visually connected

### RouteLine CSS (styles.css)
- `.route-line` - container
- `.route-stop` - individual stop
- `.route-marker` - numbered circle (1, 2, 3...)
- `.route-node` - used elsewhere for phases
- `.route-mini-bar` - progress bars

### RoadmapView.tsx
- Detailed roadmap with phase cards
- Modal for milestone editing
- Phase progress tracking

## Visual Issues to Address

1. **No visual journey** - RouteLine is just a list, not a "route" from Malden → Barcelona
2. **No connecting line** - stops are disconnected
3. **No "Malden to Barcelona" narrative** - doesn't show origin/destination
4. **Static numbered markers** - just 1, 2, 3 instead of meaningful landmarks
5. **No timeline feel** - doesn't communicate progression toward January 2027
6. **Missing visual direction concepts** - no Family Route Line, landmarks, journey metaphor

## Proposed Improvements

### 1. Transform RouteLine into "Family Route Line"
- **Horizontal or vertical timeline** from Malden → Barcelona
- **Landmarks** for each major phase: Research → Visa Path → Budget Confidence → Documents → Housing/Schools → Travel → Arrival → Stabilization
- **Connecting line** between landmarks
- **Current position indicator** (like a moving dot/pulse)
- **January 2027 destination marker**

### 2. Enhanced RouteLine Component
- Accept landmarks as props (derived from roadmap_phases)
- Show current position based on active phase
- Visual progress along the route
- Destination marker: "Barcelona - January 2027"

### 3. Visual Polish
- Connecting line with animated progress
- Landmark cards with readiness states
- Current position pulse animation
- Destination marker with Barcelona styling
- Responsive: horizontal on desktop, vertical on mobile

### 4. HomeView Integration
- Update RouteLine call to pass landmarks from roadmap_phases
- Add "Malden, Missouri → Barcelona, Spain" header
- Show current position in the journey

## Fleet Routing

| Agent | Role | Task |
|-------|------|------|
| **Nous-girl** | Visual Direction | Create visual spec for Family Route Line in docs/move-map-visual-spec.md |
| **Chizul** | Implementation | Update RouteLine.tsx, HomeView.tsx, styles.css |
| **Klerik** | Review | Verify visual polish matches spec, build passes |
| **Kashik** | Closeout | Update kanban, status.md |

## Files to Modify

1. `app/src/components/RouteLine.tsx` - Core route line component
2. `app/src/views/HomeView.tsx` - Pass landmarks, update section
3. `app/src/styles.css` - New route-line styles (connecting line, landmarks, current position, destination)
4. `app/src/views/RoadmapView.tsx` - Optional: align with new visual language

## Acceptance Criteria

- [ ] RouteLine shows Malden → Barcelona journey
- [ ] Landmarks represent planning phases
- [ ] Connecting line between landmarks
- [ ] Current position indicator
- [ ] Destination marker (Barcelona - January 2027)
- [ ] Responsive: horizontal desktop, vertical mobile
- [ ] Build passes
- [ ] Klerik approves visual polish