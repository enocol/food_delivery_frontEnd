// ─── Brand ────────────────────────────────────────────────────────────────────
export const primary = "#0284c7"; // main CTA, cart icon, active chip
export const primaryDark = "#0369a1"; // pressed / destructive variant
export const primaryDeep = "#075985"; // deep accent, location text
export const primaryBlack = "#000000"; //

// ─── Text ─────────────────────────────────────────────────────────────────────
export const textHeading = "#0c2340"; // top-level headings
export const textDark = "#0c2340"; // body headings, dark labels
export const textBody = "#0c2340"; // standard body copy
export const textMid = "#475569"; // secondary / supporting text
export const textMuted = "#64748b"; // meta, timestamps, subtitles
export const textHeadingWarm = "#0c2340"; // Auth / Profile screen headings
export const textWarmDark = "#0c2340"; // HomeScreen heading, search input
export const textRestaurant = "#0c2340"; // restaurant card name
export const textMenuName = "#0c2340"; // menu item name in details screen
export const textMenuMeta = "#64748b"; // menu item description / meta
export const textSearchSub = "#475569"; // Search screen subtitle
export const textCartRestaurant = "#64748b"; // cart item restaurant name
export const textClose = "#0369a1"; // close button label
export const textItemName = "#0c2340"; // cart item name
export const textIconMuted = "#475569"; // inactive icon / metaText
export const textSubMuted = "#475569"; // shared emptySub style
export const textAmberButton = "#1c0a00"; // text on amber checkout button
export const textGreenBody = "#0c2340"; // checkout / body text on dark panel
export const textPaymentLabel = "#0c2340"; // selected payment method label
export const textOnDark = "#ffffff"; // text on dark / colored surfaces
export const textOnPrimary = "#ffffff"; // text on primary-colored buttons
export const iconBrown = "#0284c7"; // HomeScreen search / info icon
export const placeholder = "#93c5fd"; // generic placeholder text
export const placeholderWarm = "#93c5fd"; // placeholder (blue-tinted)

// ─── Success / Teal ───────────────────────────────────────────────────────────
export const success = "#0d9668"; // price tags, status "confirmed"
export const successDark = "#0c2340"; // checkout bar bg, dark navy panels
export const successDeeper = "#0369a1"; // qty-control text / icons
export const successText = "#93c5fd"; // light label on dark navy bg
export const successTint = "#e0f2fe"; // qty-button / blue tint surface

// ─── Danger / Error ───────────────────────────────────────────────────────────
export const danger = "#dc2626"; // error empty-state icon
export const dangerText = "#b42318"; // inline error messages
export const like = "#e11d48"; // heart / like active state

// ─── Amber & Orange ───────────────────────────────────────────────────────────
export const amber = "#0284c7"; // loading spinner (sky blue)
export const amberDark = "#0369a1"; // darker spinner / icon variant
export const amberLight = "#f59e0b"; // warm gold checkout / confirm button
export const orange = "#0284c7"; // location icon, empty-state icon
export const orangeText = "#0c2340"; // text alongside location / chip

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authButton = "#0284c7"; // sign-in / verify button

// ─── Neutrals / Surfaces ──────────────────────────────────────────────────────
export const white = "#ffffff";
export const black = "#000000";
export const bgWarm = "#f0f9ff"; // light sky-blue page background
export const bgWarmAlt = "#f0f9ff"; // filter chips / home search bar bg
export const bgCream = "#e0f2fe"; // close-button / chip background
export const bgOverlay = "#0c2340"; // full-screen backdrop base (dark navy)
export const bgEmptyOrange = "#e0f2fe"; // empty-state icon bg
export const bgEmptyAmber = "#e0f2fe"; // empty-state loading icon bg
export const bgEmptyDanger = "#fff1f2"; // empty-state danger icon bg
export const bgLike = "#e0f2fe"; // like button background
export const bgPaymentOption = "#f0f9ff"; // payment phone-input background
export const bgGreenTint = "#e0f2fe"; // alias of successTint
export const shadow = "#0c2340"; // drop-shadow color
export const handle = "#bae6fd"; // bottom-sheet drag handle
export const splash = "#0284c7"; // loading / splash screen background

// ─── Borders ──────────────────────────────────────────────────────────────────
export const border = "#bae6fd"; // default sky-blue border
export const borderLight = "#bae6fd"; // lighter sky-blue border
export const borderMid = "#e0f2fe"; // softer sky-blue border
export const borderOrange = "#bae6fd"; // icon card border
export const borderGreen = "#bae6fd"; // unselected payment-method border
export const borderEmptyAmber = "#bae6fd"; // loading empty-state icon border
export const borderEmptyDanger = "#fecdd3"; // danger empty-state icon border
export const borderSheet = "#bae6fd"; // bottom-sheet outer border
export const borderQty = "#bae6fd"; // qty-control border
export const borderPaymentOption = "#bae6fd"; // payment phone-input border
export const borderModalWarm = "#bae6fd"; // location modal card border
export const borderFilterChip = "#bae6fd"; // food filter chip border
export const borderSearchBar = "#bae6fd"; // home search bar border
export const borderInput = "#bae6fd"; // auth text-input border
export const borderPicker = "#bae6fd"; // country picker border
export const borderCartHeader = "#bae6fd"; // cart header button border
export const borderLike = "#bae6fd"; // like button border

// ─── Gradients ────────────────────────────────────────────────────────────────
// Usage: <LinearGradient colors={colors.gradients.warmCream} ... />
export const gradients = {
  warmCream: ["#e0f2fe", "#f0f9ff"], // Auth, Orders, Profile screens
  warmHome: ["#e0f2fe", "#f0f9ff", "#f8fafc"], // Home screen
  greenLight: ["#e0f2fe", "#f0f9ff"], // Checkout screen
  greenSheet: ["#f0f9ff", "#f8fafc"], // Cart bottom sheet
  mint: ["#e0f2fe", "#f0f9ff"], // Search screen
  white: ["#ffffff", "#f8fafc"], // subtle white gradient for cards
};

// ─── Semi-transparent overlays (use as-is) ────────────────────────────────────
export const overlays = {
  tabBarBg: "rgba(240, 249, 255, 0.92)",
  tabBarBorder: "rgba(186, 230, 253, 0.80)",
  locationBackdrop: "rgba(12, 35, 64, 0.50)",
  backButtonBg: "rgba(240, 249, 255, 0.9)",
  closeButtonBg: "rgba(240, 249, 255, 0.9)",
};
