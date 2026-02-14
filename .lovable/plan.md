

# Darken the Background: From Grey-Blue to True Black

## The Problem
The current background uses `220 15% 7%` which has a blue tint and 7% lightness, making it look like dark grey rather than black. Cards at 11% lightness compound this washed-out feel.

## The Fix
Drop the saturation and lightness on all dark surfaces to get back to a true black foundation while keeping the clinical-luxury accent colors.

### CSS Variable Changes (src/index.css)

| Token | Current | New | Why |
|-------|---------|-----|-----|
| --background | 220 15% 7% | 220 10% 4% | Near-black with minimal blue tint |
| --card | 220 14% 11% | 220 10% 7% | Darker cards, still distinguishable |
| --popover | 220 14% 11% | 220 10% 7% | Match card darkness |
| --muted | 220 12% 16% | 220 10% 12% | Darker muted surfaces |
| --input | 220 12% 16% | 220 10% 12% | Match muted |
| --border | 220 12% 20% | 220 10% 15% | Subtler borders |
| --obsidian | 220 15% 7% | 220 10% 4% | Match background |
| --obsidian-light | 220 14% 11% | 220 10% 7% | Match card |
| --glass-border | 220 12% 25% | 220 10% 18% | Subtler glass edges |
| --sidebar-background | 220 15% 9% | 220 10% 5% | Darker sidebar |
| --sidebar-accent | 220 12% 16% | 220 10% 12% | Match muted |
| --sidebar-border | 220 12% 20% | 220 10% 15% | Match border |

### Body Gradient
Update from `hsl(220, 15%, 8%) to hsl(220, 15%, 5%)` to `hsl(220, 10%, 4%) to hsl(220, 10%, 2%)` for a near-pure-black base.

### Glassmorphism Card
Update `.glass-card` background from `hsla(220, 14%, 13%, 0.6)` to `hsla(220, 10%, 8%, 0.6)` and the border from `hsla(220, 12%, 28%, 0.3)` to `hsla(220, 10%, 20%, 0.3)`.

### Files to Edit
- `src/index.css` (only file affected -- all changes are CSS variable updates)

### What Stays the Same
- All accent colors (teal, rose-gold, lavender)
- All component layouts and logic
- Glow/animation effects (they'll actually pop more against true black)

