# Animation System Review & Implementation Plan

## Baunfire Website Analysis

### Key Animation Patterns Observed:

1. **Hero Section Animations**
   - Smooth fade-in with upward movement
   - Staggered text reveals (headline first, then subtext)
   - Subtle scale effects on interactive elements
   - Professional timing (0.8-1.2s durations)

2. **Scroll-Triggered Animations**
   - Progressive reveal of content sections
   - Fade-up animations with slight scale
   - Intersection Observer for performance
   - Smooth easing curves

3. **Interactive Elements**
   - Hover states with scale and shadow
   - Smooth transitions on buttons and links
   - Subtle color shifts
   - Professional micro-interactions

4. **Typography Animations**
   - Word-by-word or line-by-line reveals
   - Staggered character animations
   - Opacity and transform combinations
   - Apple-style easing curves

## Implementation Recommendations

### Phase 1: Hero Section Overhaul
- **Text Reveal**: Implement word-by-word animation for headline
- **Staggered Content**: Badge, headline, description, CTA, search bar
- **Background Effects**: Subtle parallax or gradient animations
- **Timing**: 0.2s stagger between elements

### Phase 2: Scroll Animations Enhancement
- **Progressive Reveal**: Sections fade in as user scrolls
- **Scale Effects**: Subtle scale from 0.95 to 1.0
- **Directional Movement**: Cards slide up from bottom
- **Performance**: GPU-accelerated transforms only

### Phase 3: Interactive Polish
- **Button States**: Scale 1.05 + shadow intensification
- **Card Hovers**: Subtle lift effect with shadow
- **Navigation**: Smooth underline morphing
- **Form Elements**: Focus states with transitions

## Technical Implementation Strategy

### Animation Library: Framer Motion
- **Why**: Best-in-class for React animations
- **Features**: Scroll triggers, stagger, spring physics
- **Performance**: GPU-accelerated, accessibility support

### Performance Considerations
- **GPU Only**: Only animate transform and opacity
- **Reduced Motion**: Respect user preferences
- **Bundle Size**: Keep animations lightweight
- **Intersection Observer**: Trigger animations only when visible

### Accessibility Standards
- **prefers-reduced-motion**: Disable animations when requested
- **Screen Readers**: Ensure content accessible without animations
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Color Contrast**: Maintain WCAG AA standards

## Animation Timeline

### Homepage Load Sequence:
1. **0.0s**: Background elements fade in
2. **0.3s**: Badge appears (fade-up)
3. **0.5s**: Headline starts (word-by-word reveal)
4. **1.2s**: Description fades in
5. **1.5s**: CTA buttons appear
6. **1.8s**: Search bar fades in

### Scroll Animations:
- **-100px margin**: Start animations before element fully visible
- **0.6s duration**: Smooth, professional timing
- **0.1s stagger**: Multiple elements in sequence
- **Once**: Animations trigger only once per session

## Code Architecture

### Custom Hooks
- `usePrefersReducedMotion()`: Accessibility detection
- `useScrollTrigger()`: Intersection Observer wrapper
- `useWordAnimation()`: Text reveal utilities

### Component Structure
- **AnimatedSection**: Reusable scroll-trigger wrapper
- **AnimatedText**: Word/character reveal component
- **InteractiveButton**: Enhanced button with hover states
- **AnimatedCard**: Card with scroll animations

### Performance Optimization
- **Will-change**: Add sparingly for complex animations
- **Transform3d**: Force GPU acceleration when needed
- **Debounce**: Scroll event optimization
- **Lazy Loading**: Animations below fold load later

## Success Metrics

### Performance Targets
- **Lighthouse**: 99+ Performance score
- **Core Web Vitals**: All green metrics
- **Bundle Size**: <250KB total JavaScript
- **Animation FPS**: Maintain 60fps throughout

### User Experience Goals
- **Engagement**: Increased time on page
- **Professionalism**: Award-worthy visual polish
- **Accessibility**: 100% accessibility score
- **Mobile**: Smooth performance on all devices

## Implementation Priority

### High Priority (Immediate Impact)
1. Hero section text animations
2. Scroll-triggered section reveals
3. Interactive button states
4. Performance optimization

### Medium Priority (Enhancement)
1. Card hover effects
2. Navigation animations
3. Form interactions
4. Background effects

### Low Priority (Polish)
1. Page transitions
2. Loading animations
3. Error states
4. Easter eggs

---

## FOUC Fix (Flash of Unstyled Content on Vercel)

### Problem

`globals.css` uses this pattern to prevent theme-color flash:

```css
html { opacity: 0; }
html[data-theme='dark'], html[data-theme='light'] { opacity: initial; }
```

`InitTheme` (`strategy="beforeInteractive"`) runs synchronously before React or Framer Motion loads, sets `data-theme` on `<html>`, and immediately triggers `opacity: initial` — making the **entire page visible** before Framer Motion has a chance to apply its initial hidden state. Result: fully-rendered content flashes on screen for 100–300ms before animations start.

### Fix

**Step 1 — CSS safety net** (`globals.css`):

```css
/* Desktop only — mobile has no animations */
@media (min-width: 768px) {
  .will-animate {
    opacity: 0;
  }
}
```

Applied to every animated element via `HeroReveal` and `ScrollReveal`. Hides elements on first paint — before any script runs. Framer Motion's inline styles (higher specificity than class rules) automatically override it when animation starts.

**Step 2 — Object-form `initial` in Framer Motion**:

Framer Motion's string-form `initial="hidden"` does a variant lookup at runtime. Object-form `initial={{ opacity: 0 }}` is written directly into the SSR HTML as an inline style, so it's applied on the very first paint.

```tsx
// ❌ Unreliable in Next.js App Router SSR
initial="hidden"

// ✅ Inline style written to SSR HTML
initial={{ opacity: 0 }}
```

Both components (`HeroReveal`, `ScrollReveal`) now use object-form `initial` + the `will-animate` CSS class for double-layer protection.

### Why Two Layers?

| Layer | When It Applies | Mechanism |
|-------|----------------|-----------|
| `.will-animate { opacity: 0 }` | Before any JS | CSS class (no JS needed) |
| `initial={{ opacity: 0 }}` | SSR HTML inline style | Framer Motion SSR |
| Framer Motion animation | After hydration | Inline style override |

The CSS class alone is sufficient for the Vercel flash, but the object-form `initial` ensures there is no hydration mismatch if the CSS class ever fails to load.

---

*This document serves as the technical specification for implementing Baunfire-inspired animations while maintaining performance and accessibility standards.*