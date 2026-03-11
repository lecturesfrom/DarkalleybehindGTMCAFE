# FRONTEND_GUIDELINES — GTM Cafe_Raffle

## Brand Concept

**The Dark Alley**: You're on a buzzing city street — laughter, energy, GTM Cafe's front door. You slip into the dark alley behind it. A couple of people are talking in low tones, exchanging something useful — a referral link. The alley is dim but alive. There's grit, neon, warmth in the shadows.

The aesthetic is **dark underground meets urban warmth**. Not corporate. Not sterile. Premium but with personality. Think: dark mode default, neon accent glows, subtle texture, and a sense of something happening in the shadows.

## Color Palette

### Dark Mode (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0A0A0F` | Page background, deepest layer |
| `bg-surface` | `#141420` | Cards, panels, elevated surfaces |
| `bg-surface-hover` | `#1C1C2E` | Hover states on surfaces |
| `bg-elevated` | `#222238` | Modals, dropdowns, popovers |
| `text-primary` | `#F0F0F5` | Primary text, headings |
| `text-secondary` | `#9494A8` | Secondary text, descriptions |
| `text-muted` | `#5C5C72` | Placeholder text, disabled states |
| `border-default` | `#2A2A3E` | Default borders |
| `border-subtle` | `#1E1E30` | Subtle dividers |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-neon` | `#00FF88` | Primary action buttons, success, "the glow" |
| `accent-neon-dim` | `#00CC6A` | Hover state for neon |
| `accent-amber` | `#FFB800` | Warnings, highlights, "alley light" |
| `accent-red` | `#FF4757` | Errors, destructive actions, flags |
| `accent-blue` | `#4A9EFF` | Links, informational |
| `accent-purple` | `#8B5CF6` | Badges, contributor identity |

### Neon Glow Effect
```css
/* Use on primary CTAs and key interactive elements */
.glow-neon {
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.15), 0 0 40px rgba(0, 255, 136, 0.05);
}
.glow-neon:hover {
  box-shadow: 0 0 25px rgba(0, 255, 136, 0.25), 0 0 50px rgba(0, 255, 136, 0.1);
}
```

## Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Font family | `Inter` (Google Fonts) | — | — | — |
| Font mono | `JetBrains Mono` | — | — | — |
| H1 | Inter | 36px / `text-4xl` | 700 | 1.2 |
| H2 | Inter | 30px / `text-3xl` | 600 | 1.25 |
| H3 | Inter | 24px / `text-2xl` | 600 | 1.3 |
| H4 | Inter | 20px / `text-xl` | 500 | 1.4 |
| Body | Inter | 16px / `text-base` | 400 | 1.6 |
| Body small | Inter | 14px / `text-sm` | 400 | 1.5 |
| Caption | Inter | 12px / `text-xs` | 400 | 1.5 |
| Code/URLs | JetBrains Mono | 14px / `text-sm` | 400 | 1.5 |

## Spacing Scale

Base unit: 4px. Use Tailwind spacing tokens exclusively.

| Token | Value | Usage |
|-------|-------|-------|
| `p-1` / `m-1` | 4px | Tight internal spacing |
| `p-2` / `m-2` | 8px | Between related elements |
| `p-3` / `m-3` | 12px | Form field padding |
| `p-4` / `m-4` | 16px | Card padding (mobile), element gaps |
| `p-6` / `m-6` | 24px | Card padding (desktop), section gaps |
| `p-8` / `m-8` | 32px | Section padding |
| `p-12` / `m-12` | 48px | Large section spacing |
| `p-16` / `m-16` | 64px | Page-level spacing |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small elements (badges, tags) |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards, panels |
| `rounded-xl` | 16px | Modals, hero elements |
| `rounded-full` | 9999px | Avatars, pills |

## Shadows

```
shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3)
shadow-md:   0 4px 6px rgba(0, 0, 0, 0.4)
shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.5)
shadow-glow: 0 0 20px rgba(0, 255, 136, 0.15)
```

## Component Patterns

### Buttons
```
Primary:    bg-accent-neon text-bg-primary font-semibold rounded-md px-6 py-3 glow-neon
            Hover: bg-accent-neon-dim
Secondary:  bg-transparent border border-accent-neon text-accent-neon rounded-md px-6 py-3
            Hover: bg-accent-neon/10
Ghost:      bg-transparent text-text-secondary rounded-md px-4 py-2
            Hover: bg-bg-surface-hover text-text-primary
Danger:     bg-accent-red text-white rounded-md px-6 py-3
            Hover: bg-accent-red/80
```

### Cards
```
bg-bg-surface border border-border-default rounded-lg p-6
Hover: border-border-default/60 shadow-md
```

### Inputs
```
bg-bg-primary border border-border-default rounded-md px-4 py-3 text-text-primary
placeholder:text-text-muted
Focus: border-accent-neon ring-1 ring-accent-neon/30
Error: border-accent-red ring-1 ring-accent-red/30
```

### Modals
```
bg-bg-elevated border border-border-default rounded-xl p-8 shadow-lg
Overlay: bg-black/60 backdrop-blur-sm
```

### Tables
```
Header: bg-bg-surface text-text-secondary text-sm uppercase tracking-wider
Row: border-b border-border-subtle
Row hover: bg-bg-surface-hover
```

### Badges/Status
```
Active:     bg-accent-neon/10 text-accent-neon border border-accent-neon/20 rounded-full px-3 py-1 text-xs
Pending:    bg-accent-amber/10 text-accent-amber border border-accent-amber/20
Suspended:  bg-accent-red/10 text-accent-red border border-accent-red/20
```

## Responsive Breakpoints

Mobile-first. All base styles target mobile (320px+).

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Large phones, landscape |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

### Layout Rules
- Max content width: `max-w-6xl` (1152px)
- Sidebar: hidden on mobile, 256px on `lg:` and up
- Page padding: `px-4` mobile, `px-6` tablet, `px-8` desktop
- Cards: single column mobile, two columns `md:`, three columns `lg:`
- Nav: hamburger + bottom bar on mobile, full horizontal on `md:+`

### Mobile Bottom Bar
Four icon buttons, fixed to bottom:
- Dashboard (home icon)
- Drop (plus-circle icon)
- Raffle (shuffle icon)
- My Links (link icon)

## Micro-Interactions

- **Button hover**: `transition-all duration-150 ease-out`, subtle scale `hover:scale-[1.02]`
- **Button active**: `active:scale-[0.98]`
- **Card hover**: border brightens, shadow deepens, `transition-all duration-200`
- **Raffle result**: Card slides in from bottom with spring animation
- **Toast notifications**: Slide in from top-right, auto-dismiss after 5s
- **Loading states**: Pulsing neon skeleton lines, not gray placeholders
- **Page transitions**: Subtle fade, `duration-150`
- **Copy button**: Click → icon changes to checkmark → revert after 2s

## Texture + Atmosphere

- Subtle noise/grain texture overlay on `bg-primary` (very low opacity, ~2%)
- Optional: faint brick/wall texture on landing page hero (the "alley wall")
- Neon sign effect for logo/brand name on landing page
- Dark gradient overlays on hero sections: `bg-gradient-to-b from-bg-primary/80 to-bg-primary`

## Iconography

- Use Lucide React exclusively
- Icon size: 16px (`w-4 h-4`) inline, 20px (`w-5 h-5`) in nav, 24px (`w-6 h-6`) standalone
- Icon color: `text-text-secondary`, active: `text-accent-neon`

## Accessibility

- All interactive elements must have visible focus states (ring-2 ring-accent-neon/50)
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text
- All images have alt text
- Interactive elements have aria labels where text isn't visible
- Keyboard navigable: all actions reachable via Tab/Enter/Escape
