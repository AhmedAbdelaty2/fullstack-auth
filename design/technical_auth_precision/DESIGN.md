---
name: Technical Auth Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#0051b1'
  on-tertiary: '#ffffff'
  tertiary-container: '#0f69dc'
  on-tertiary-container: '#edf0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a refined, developer-first engineering aesthetic tailored for modern authentication and onboarding flows. The target audience encompasses software engineers, platform architects, and tech-forward operators who value velocity, structural integrity, and uncompromised clarity over decorative embellishments.

The emotional signature is focused, reliable, and mathematically grounded. Visual treatments pull from crisp technical minimalism: functional white and slate surfaces, structural hairline delimiters, and purposeful royal blue focal points. By juxtaposing the geometric structural flair of Space Grotesk against the neutral, high-density legibility of Geist, the interface eliminates cognitive noise, projecting institutional confidence and precision security.

## Colors

The palette is strictly calibrated for high-contrast light mode, emphasizing rapid scanning and accessible validation states.

- **Primary (`#2563EB`)**: Anchor accent utilized strictly for high-priority actions, verified security badges, interactive focus indicators, and key sign-in triggers.
- **Secondary (`#0F172A`)**: Deep slate foundation providing high-density optical weight for primary headlines, data values, and structural framing.
- **Tertiary (`#3B82F6`)**: Lighter technical blue allocated for interactive hover states, subtle active highlights, and progress bar fills.
- **Neutral (`#64748B`)**: Muted slate for secondary descriptions, field labels, metadata, and empty states.
- **Surface & Canvas (`#FFFFFF` / `#F8FAFC`)**: Pure white reserved for focal cards, modals, and input fields; canvas washed in an ultra-pale slate tint (`#F8FAFC`) to supply natural figure-ground separation without heavy borders.
- **Borders & Dividers (`#E2E8F0`)**: Crisp, low-contrast neutral lines defining form zones and card boundaries.
- **State Colors**: Semantic feedback aligns with standard telemetry—`#EF4444` (critical/error), `#10B981` (authenticated/success), and `#F59E0B` (session warning).

## Typography

Typography establishes an engineering hierarchy:

- **Space Grotesk** is used for headline elements to introduce calculated geometric distinctiveness. Its technical curves inject character into authentication gates, session headings, and primary modal titles without hindering clarity.
- **Geist** functions as the primary vehicle for form inputs, descriptions, checklist criteria, and micro-copy. Its neutral proportions and horizontal metrics ensure zero visual distortion during multi-step input validation and error parsing.
- Monospaced numeric rendering (`tabular-nums`) should be applied dynamically to session countdowns, two-factor code fields, and passkey verification states.

## Layout & Spacing

Authentication screens rely on a constrained single-column card layout centered both vertically and horizontally within the viewport.

- **Grid & Sizing Rules**: The primary authentication container locks to a maximum width of `400px` (or `440px` for multi-step enterprise workflows). On viewports above `1024px`, split-layout screens allocate a fixed `480px` interaction column alongside a contextual product preview panel.
- **Vertical Cadence**: The system uses an uncompromising 4px baseline system (`0.25rem`). Standard field-to-label separation is strictly `space-xs` (4px), while sequential input stack spacing enforces `space-md` (16px). Form action buttons sit `space-lg` (24px) below final input elements.
- **Responsive Adaptations**:
  - **Mobile (< 640px)**: The container shifts from a floating card to a full-bleed surface anchored to the top of the viewport with `margin` (16px) dynamic edge padding, ensuring zero layout cramping around the software keyboard.
  - **Tablet & Desktop (≥ 640px)**: Floating card with centered alignment, employing `space-xl` internal container padding.

## Elevation & Depth

Visual hierarchy favors clean structural planar separation over artificial shadows:

- **Flat Foundation**: Surfaces lean heavily on 1px structural outlines (`#E2E8F0`) set against `#FFFFFF` and `#F8FAFC`.
- **Card Depth**: The central auth card applies an ultra-subtle ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`. This creates razor-thin tactile presence without dirtying the light canvas.
- **Floating Overlays & Popovers**: SSO selection menus, dropdown tooltips, and credential menus employ a clean secondary elevation: `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Active Focus Elevation**: Depth is communicated interactively via ring layers rather than drop shadows. All interactive surfaces utilize a crisp 2px primary accent ring (`#2563EB`) accompanied by a 2px pure white (`#FFFFFF`) offset boundary.

## Shapes

The design uses a clean, soft curvature (`roundedness: 1`) to preserve an architectural feel:

- **Standard Base Radii (`0.25rem` / 4px)**: Assigned to micro-elements, checkboxes, inline code tags, and small validation badges.
- **Input & Action Radii (`rounded-lg` / `0.5rem` / 8px)**: Applied systematically across primary form fields, SSO authenticators, buttons, and segmented controls.
- **Card & Dialog Radii (`rounded-xl` / `0.75rem` / 12px)**: Utilized for the main authentication card, identity verification modals, and elevated dialog envelopes.

## Components

### Buttons
- **Primary**: Solid `#2563EB` background with `#FFFFFF` text. Flat height of `40px` (`h-10`), internal horizontal padding of `space-md` (16px). Transition duration: 150ms. Hover: `#1D4ED8`. Active state: `#1E40AF`.
- **Secondary / SSO Provider**: Crisp `#FFFFFF` background with 1px `#E2E8F0` border, `#0F172A` text, and centered provider iconography (GitHub, Google, SAML). Hover: `#F8FAFC` background with `#CBD5E1` border.
- **Ghost / Link**: Unbordered transparent background with `#2563EB` text; text underline reveals solely on hover state.

### Input Fields
- **Container**: Native `40px` height, `#FFFFFF` surface, surrounded by a 1px `#E2E8F0` border. Text set in Geist `body-md` (`#0F172A`). Placeholder text locked to `#94A3B8`.
- **States**:
  - Focus: Hairline border shifts to `#2563EB` paired with `focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`.
  - Error: Border shifts to `#EF4444` paired with an inline assistive error label in `body-sm` (`#EF4444`) positioned `space-xs` beneath the field.

### Checkboxes & Radio Controls
- **Checkboxes**: Dimensioned at `16px x 16px` with a `4px` corner radius. Unchecked state: `#FFFFFF` with a 1px `#CBD5E1` border. Checked state: `#2563EB` fill displaying a sharp `#FFFFFF` checkmark icon.

### Authentication Checklist (Password Rules & MFA)
- Stacked vertical list with `space-sm` gap.
- Items feature a `14px` status glyph: a slate circle with a trailing dot for incomplete criteria, turning into a clean `#10B981` check badge upon condition validation. Text rendered in `body-sm` (`#64748B`), shifting to `#0F172A` when fulfilled.

### One-Time Password (OTP) / Passkey Inputs
- 6-slot segmented box matrix. Each slot measures `44px x 48px`, centered, font sized at `Space Grotesk` 20px bold. Active caret slot signals focus with an immediate `#2563EB` ring-2 treatment.

### Cards
- Central authentication wrapper featuring a pure `#FFFFFF` background, a razor-thin 1px `#E2E8F0` border, `0.75rem` (`rounded-xl`) corner radius, and `space-xl` (32px) internal padding.