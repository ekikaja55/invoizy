---
name: invoizy-design-system
description: Enforces the Invoizy Organic Maximalism & Digital Scrapbook design system for Svelte and Tailwind CSS components. Use when reviewing code, generating UI components, or suggesting layout structures.
---

# Invoizy Design System Skill

When writing or reviewing Svelte components and Tailwind CSS classes for the Invoizy project, strictly adhere to these design principles:

## 1. Color Protocol & Theming

You must ONLY use the approved palette values or their Tailwind aliases defined in `src/app.css` (`@theme`). Do not introduce generic Tailwind colors (like `blue-500` or `gray-300`).

- **Canvas Backgrounds:**
  - Light Mode: Papaya Whip (`#ffecd1` / `bg-papaya`)
  - Dark Mode: Ink Black (`#001524` / `bg-ink`)
- **Primary Text:**
  - Light Mode: Ink Black (`#001524` / `text-ink`)
  - Dark Mode: Papaya Whip (`#ffecd1` / `text-papaya`)
- **Primary Actions & CTA:** Vivid Tangerine (`#ff7d00` / `bg-tangerine`, `text-white` or `text-ink`)
- **Hard Shadows & Structural Outlines:** Brandy (`#78290f` / `border-brandy`, `shadow-[4px_4px_0px_#78290f]`)
- **Secondary Elements & Bento Cards:** Stormy Teal (`#15616d` / `bg-teal`, `text-teal`)
- **Semantic Status Colors (Transactional & Feedback):**
  - Failure / Danger / Expired: Crimson (`#c1121f` / `text-crimson`, `bg-crimson/15`, `border-crimson`)
  - Success / Paid / Verified: Forest Emerald (`#2b9348` / `text-forest`, `bg-forest/15`, `border-forest`)

## 2. Aesthetics & Controlled Chaos ("Jalan Tengah")

- **No generic drop shadows.** Use solid, unblurred offset shadows with Brandy (e.g., `shadow-[3px_3px_0px_#78290f]` or `shadow-[4px_4px_0px_#78290f]`).
- **Organic & Asymmetrical Borders for Emphasis:** Apply irregular border radii for buttons, badges, and showcase cards (e.g., `rounded-[255px_15px_225px_15px/15px_225px_15px_255px]` or `rounded-[14px_6px_12px_8px]`).
- **Tactile Rotations:** Add subtle rotations (`rotate-1`, `-rotate-2`, `-rotate-6` for stamps) on stickers, status chips, and floating badges.
- **Transactional Precision:** Form inputs (`<input>`, `<select>`, `<textarea>`) and data table rows MUST maintain clean, stable geometry to ensure effortless input and high click accuracy. Reserve chaos for container cards, tags, and stickers.

## 3. Typography Utility Classes

Fonts are self-hosted locally via `@fontsource` packages. Use the corresponding Tailwind classes:

- `font-headline` (`Fraunces`): For H1, H2, and prominent price figures.
- `font-handwriting` (`Caveat`): For stickers, scrapbook microcopy, store notes, and playful accents.
- `font-sans` (`Plus Jakarta Sans`): For clean body copy, form labels, and table contents.
- `font-mono` (`Space Mono`): Exclusively for Order IDs, Passcodes, unique transfer codes, and tracking numbers.

## 4. Spatial Layering (Z-Index Scale)

Adhere strictly to this layering hierarchy:
- `z-0`: Canvas background & grain texture.
- `z-10`: Core content (Cards, Forms, Data Tables).
- `z-20`: Intervention layer (Decorative stickers, tape, floating badges).
- `z-30`: Global navigation & sticky header bar.
- `z-40`: Modal/Drawer backdrop (`bg-ink/80` or `bg-[#001524]/80`).
- `z-50`: Interactive modal dialogs & sheets.
- `z-100`: Sonner toast notifications ("sticky note" popups).

## 5. Performance & Print Integrity

- Avoid heavy `backdrop-blur` on mobile overlays; prefer solid `bg-ink/80`.
- All transitions and animations must strictly use GPU-accelerated properties (`transform` and `opacity`).
- In `<InvoiceDocument />` and print views (`@media print`), strip out backdrop filters and blurred shadows, enforce `-webkit-print-color-adjust: exact`, and ensure dark `Ink Black` text over clean paper background for crisp physical receipts.
