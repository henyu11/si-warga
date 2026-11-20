---
name: SiWarga Civic Balance
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#0142cd'
  on-tertiary: '#ffffff'
  tertiary-container: '#325de6'
  on-tertiary-container: '#e7e9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b7c4ff'
  on-tertiary-fixed: '#001551'
  on-tertiary-fixed-variant: '#0039b5'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.025em
  currency-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  currency-table:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system is engineered for civic transparency, administrative efficiency, and community trust. It serves Indonesian neighborhood officers (Ketua RT/RW, Bendahara, and Sekretaris) aged 30–60 who require clear legibility, foolproof financial flows, and instant utility across desktop dashboards and mobile handheld checks.

Drawing from modern utility SaaS aesthetics (Tailwind CSS and shadcn/ui mechanics), the visual language prioritizes:
- **Absolute Legibility & Contrast**: Sharp borders, distinct tonal containers, and large touch targets to accommodate varied digital literacy and screen qualities.
- **Civic Accountability**: Dedicated dual-ledger visual compartmentalization that strictly delineates public operational funds from specialized security fees.
- **Action-Driven Utility**: High-visibility direct action points, notably one-click WhatsApp broadcast billing, rapid fee reconciliation, and ledger oversight.

## Colors

The palette establishes an authoritative civic presence using balanced teal, emerald, and royal blue accents anchored on structured slate neutrals.

### Surface & Neutral Architecture
- **Canvas Base**: `#F8FAFC` (Slate 50) establishes a clean, glare-free background.
- **Card / Modal Surface**: `#FFFFFF` for primary elevations.
- **Structural Borders**: `#E2E8F0` (Slate 200) for grid dividers, inputs, and container edges.
- **Text Primary**: `#0F172A` (Slate 900) provides high-contrast WCAG AAA readability for headers and ledger figures.
- **Text Secondary**: `#475569` (Slate 600) for standard labels and metadata.
- **Text Muted**: `#64748B` (Slate 500) for helper text and secondary timestamps.

### Primary Brand
- **Teal Accent**: `#0F766E` (Teal 700), interacting hover `#115E59`, subtle container surface `#F0FDFA`, and border `#99F6E4`. Used for core navigation, master CTA buttons, active state indicators, and primary metrics.

### Dual-Ledger Identity (Critical)
To prevent commingling of RT funds, every financial visual token must map to one of two structural ledgers:
1. **Kas Umum (Operational / Routine RT Fund)**:
   - Primary: `#059669` (Emerald 600)
   - Background Surface: `#ECFDF5`
   - Border Accent: `#A7F3D0`
   - Text Token: `#065F46`
2. **Kas Keamanan (Security, Guard Payroll, Night Patrol Fines)**:
   - Primary: `#1D4ED8` (Royal Blue 700)
   - Background Surface: `#EFF6FF`
   - Border Accent: `#BFDBFE`
   - Text Token: `#1E40AF`

### Status & Utility Tokens
- **WhatsApp Direct Action**: `#16A34A` (Green 600), Hover `#15803D` (Green 700). Dedicated solely to invoice forwarding, citizen notifications, and WhatsApp ledger reminders.
- **Status: Lunas (Paid in Full)**: Badge `#DCFCE7` text `#15803D`.
- **Status: Sebagian / Denda (Partial / Fine Incurred)**: Badge `#FEF3C7` text `#B45309`.
- **Status: Belum Bayar / Pengeluaran (Unpaid / Expense)**: Badge `#FFE4E6` text `#BE123C`.

## Typography

The typographic hierarchy utilizes Plus Jakarta Sans exclusively to deliver clear letterforms with ample counter-spaces that remain legible even on budget mobile screens under high ambient sunlight.

### Numbers & Tabular Currency
- All Indonesian Rupiah figures (`Rp 150.000`), household counts, and phone numbers must declare CSS `font-variant-numeric: tabular-nums` (or `font-feature-settings: "tnum"`).
- Currency suffixes and headers must align precisely along column bounds without horizontal jitter.

### Application Guidelines
- **Headlines**: Semi-bold to bold weight with tight negative tracking (`-0.01em` to `-0.02em`) to structure the top-level financial summaries cleanly.
- **Labels & Micro-copy**: Medium (`500`) and Semi-Bold (`600`) weights for form fields, transaction categorizations, and table heads.
- **Reading Comfort**: Body copy must not drop below 14px on desktop or mobile dashboard screens to ensure accessibility for older neighborhood administrators.

## Layout & Spacing

The system enforces a structured desktop-to-mobile layout model tailored for rapid data verification.

### Breakpoints & Adaptive Layouts
- **Desktop (1024px – 1440px+)**:
  - **Sidebar**: Fixed width `260px`, height `100vh`, non-collapsing by default for rapid multi-ledger access.
  - **Top Navigation Bar**: Height `64px`, sticky, containing resident quick-search and user profile dropdown.
  - **Main Content**: Max-width `1280px` centered canvas, 12-column responsive grid with `1.5rem` (`24px`) gutters and `2rem` (`32px`) screen margins.
- **Mobile (320px – 768px, target 390px)**:
  - **Sticky Top Bar**: `56px` height containing the current RT/RW scope badge and rapid notification center.
  - **Bottom Navigation**: Fixed `64px` height with safe-area padding containing 5 core destinations: *Beranda*, *Tagihan*, *Tagih WA*, *Kas*, and *Menu*.
  - **Gutter & Margins**: `1rem` (`16px`) grid gutters and horizontal margins to maximize card real estate.

### Spacing Scale
All vertical stacks and internal card paddings use multiples of the 4px/8px rhythm:
- `space-xs` (4px): Chip internal spacing, badge paddings.
- `space-sm` (8px): Icon-to-text spacing, compact list item gaps.
- `space-md` (16px): Input paddings, standard card body padding on mobile.
- `space-lg` (24px): Desktop card internal padding, section breaks.
- `space-xl` (32px): Module stack distance.
- `space-2xl` (48px): Page-level segment spacing.

## Elevation & Depth

Visual hierarchy relies on clean borders combined with subtle, high-diffusion shadows. This creates a tactile SaaS utility interface without overwhelming visual weight.

### Surface Tiers
- **Tier 0 (Base)**: `#F8FAFC` canvas. Flat, zero elevation.
- **Tier 1 (Cards, Ledger Lists, Modules)**: `#FFFFFF` surface enclosed by a 1px solid border of `#E2E8F0` and an ambient shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Tier 2 (Dropdowns, Popovers, Floating Stats)**: `#FFFFFF` surface with `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`, border `#CBD5E1`.
- **Tier 3 (Modals, Citizen Detail Drawers, Mobile Bottom Navigation)**: `#FFFFFF` surface with `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`. Mobile bottom bar uses an upward diffuse border: `border-top: 1px solid #E2E8F0`.

### Dual-Ledger Surface Elevation
To signal fund context, financial overview cards feature a top border accent (3px height) or full tinted card surface:
- Kas Umum card uses background `#FFFFFF` with a top structural accent in `#059669`.
- Kas Keamanan card uses background `#FFFFFF` with a top structural accent in `#1D4ED8`.

## Shapes

The geometric framework applies modern rounded corners to balance approachability with enterprise utility.

- **Base Corner Radius (0.5rem / 8px)**: Applied to input fields, buttons, table cell groups, search bars, and dropdown menus.
- **Large Radius (1rem / 12px or `rounded-xl`)**: Applied to all content cards, dashboard stat containers, modal containers, and bottom sheet dialogs.
- **Pill (Full Radius / 9999px)**: Reserved strictly for status badges (e.g., *Lunas*, *Denda*), numerical badge counters, and avatar initial containers.

## Components

### Buttons
- **Primary Action**: Background `#0F766E`, text `#FFFFFF`, border-radius 8px, hover `#115E59`. Minimum target 44px height on mobile.
- **Secondary / Outline**: Background `#FFFFFF`, border 1px solid `#CBD5E1`, text `#0F172A`, hover `#F1F5F9`.
- **WhatsApp Action Button**: Background `#16A34A`, text `#FFFFFF`, hover `#15803D`. Paired with an integrated WhatsApp icon for rapid invoicing.
- **Kas Switcher Buttons**: Pill or segmented toggles explicitly switching contexts between "Kas Umum" (`#059669`) and "Kas Keamanan" (`#1D4ED8`).

### Status Badges
Rendered with `border-radius: 9999px`, padding `0.25rem 0.75rem`, font size `12px`, font weight `600`:
- **Lunas**: `#DCFCE7` background, `#15803D` text.
- **Sebagian / Denda**: `#FEF3C7` background, `#B45309` text.
- **Belum Bayar**: `#FFE4E6` background, `#BE123C` text.

### Cards & Ledger Containers
- Default structure: `#FFFFFF` background, border `1px solid #E2E8F0`, corner radius `12px`, padding `16px` (mobile) / `24px` (desktop).
- **Dual-Ledger Stat Card**:
  - Header displays an icon tinted with the ledger color.
  - Figure rendered in `currency-display` (28px tabular-nums).
  - Footer contains a breakdown line item (e.g., "78 dari 92 Warga Telah Membayar").

### Input Fields & Controls
- **Inputs**: Height 44px, background `#FFFFFF`, border 1px solid `#CBD5E1`, radius 8px, padding horizontal 12px. Placeholder text `#94A3B8`. Focus state: border `#0F766E`, ring 2px translucent teal (`#CCFBF1`).
- **Currency Inputs**: Fixed left prefix container `Rp` with background `#F1F5F9` and right-aligned tabular numbers.
- **Checkboxes & Radios**: 20px size with bold teal check indicator for rapid bulk selection of citizen billing rosters.

### Citizen / Billing Lists (Mobile & Desktop)
- Rows have a minimum height of 56px for clear thumb tapping.
- Each row contains:
  1. Citizen identifier (e.g., "Bpk. Bambang - Blok A3/12").
  2. Subtext showing billing category (Kas Umum vs Kas Keamanan).
  3. Right-aligned status pill with tabular fee figure underneath.
  4. Instant action icon (WhatsApp direct-send icon button).

### Mobile Bottom Navigation Bar
- Fixed height: 64px + safe-area inset.
- Equal 5-column layout: Beranda, Tagihan, Tagih WA (center-highlighted with green accent circle), Kas, Menu.
- Active item indicator: Teal `#0F766E` label and icon; inactive item `#64748B`.