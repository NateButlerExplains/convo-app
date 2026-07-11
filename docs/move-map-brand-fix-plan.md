# Move Map Brand Fix Plan

## Problem
The "Move Map" branding in the upper-left NavRail currently uses a pill-shaped design with gradient background (`border-radius: 18px`, `linear-gradient` background). The user wants a clean rectangular box instead.

## Current State
- **NavRail.tsx line 10**: `<a className="brand" href="#home"><span>Move Map</span></a>` ✅ Already shows "Move Map"
- **styles.css lines 35-36**: `.brand` class has:
  - `border-radius: 18px` (pill-shaped)
  - `background: linear-gradient(135deg, rgba(255,255,255,.82), rgba(220,236,240,.62))` (gradient)
  - `border: 1px solid rgba(37,92,112,.18)`

## Target State
- `.brand` class should have:
  - `border-radius: 4px` (small rectangular corners)
  - `background: var(--paper-2)` or `var(--paper)` (clean solid background)
  - Keep the border for subtle definition

## Implementation Steps

1. **Update `.brand` CSS in `app/src/styles.css`**:
   - Change `border-radius: 18px` → `border-radius: 4px`
   - Change gradient background → `background: var(--paper-2)` (or `var(--paper)`)
   - Keep existing padding, font-weight, text-transform, and color properties

2. **Verify the change** by running the dev server and checking the NavRail brand element

## Files to Modify
- `app/src/styles.css` - Lines 35-36 (`.brand` class)

## Acceptance Criteria
- [ ] "Move Map" text displays in upper-left NavRail
- [ ] Brand element has rectangular shape (border-radius: 4px)
- [ ] Brand element has clean solid background (no gradient)
- [ ] Visual weight matches the rest of the NavRail navigation items