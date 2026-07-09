// Ishta design system — "Light Your Inner Path"
// Saffron · turmeric · sandalwood. Matches the website. See docs/BRANDING.md.
import { StyleSheet } from 'react-native';

export const colors = {
  // Brand
  saffron: '#E8620A', // primary — buttons, links, active, accents
  saffronLight: '#FF8A2B', // gradient highlight / pressed
  saffronDeep: '#C0390A', // gradient end
  turmeric: '#F2A900', // secondary — gradient start, numbers, highlights
  turmericDeep: '#D98E00', // icon accents
  sandal: '#E7D3AC', // borders, dividers
  sandalSoft: '#F3E6CC', // tinted section background
  sandalDeep: '#C9A96A', // border color
  maroon: '#7A1E12', // headings, deep contrast
  ivory: '#FFF8EC', // app/screen background
  cream: '#FCEFD8', // cards / chips
  ink: '#3A2410', // body text
  muted: '#8A6A47', // secondary / caption
  white: '#FFFFFF',
  onPrimary: '#FFFFFF',

  // Semantic aliases (keep existing component code working)
  bg: '#FFF8EC', // = ivory
  surface: '#FFFFFF',
  line: '#E7D3AC', // = sandal (borders/dividers)
  gold: '#F2A900', // legacy alias → turmeric
  green: '#2E7D4F', // success (Enter room, etc.)
  live: '#D8362F', // LIVE badge
};

// Warm hero/header/primary-button gradient: turmeric → saffron → deep saffron
export const gradients = {
  warm: ['#F2A900', '#E8620A', '#C0390A'] as const,
  warmLocations: [0, 0.55, 1] as const,
  start: { x: 0, y: 0 } as const,
  end: { x: 1, y: 1 } as const,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Corner radius: cards 14, inputs/chips 10, buttons pill
export const radius = { sm: 10, md: 14, lg: 14, pill: 999 };

export const fonts = {
  heading: 'Marcellus_400Regular',
  body: 'Mukta_400Regular',
  medium: 'Mukta_500Medium',
  semibold: 'Mukta_600SemiBold',
};

// Mobile type scale (see design system §2)
export const type = StyleSheet.create({
  display: { fontFamily: fonts.heading, fontSize: 26, color: colors.maroon },
  h1: { fontFamily: fonts.heading, fontSize: 22, color: colors.maroon },
  h2: { fontFamily: fonts.heading, fontSize: 19, color: colors.maroon },
  h3: { fontFamily: fonts.heading, fontSize: 17, color: colors.maroon },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, lineHeight: 22 },
  caption: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 19 },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  button: { fontFamily: fonts.semibold, fontSize: 15 },
});

// Maroon-tinted shadows (not gray)
export const shadow = {
  card: {
    shadowColor: '#7A1E12',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4,
  },
  glow: {
    shadowColor: '#E8620A',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
};
