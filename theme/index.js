import { extendTheme } from '@chakra-ui/react';

// One place for the look of the whole app. Components use the semantic tokens below
// (bg="surface", color="muted", ...) so light and dark mode need no per-component code.
const theme = extendTheme({
  config: { initialColorMode: 'system', useSystemColorMode: false },
  fonts: {
    heading: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
    body: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  },
  colors: {
    // Deep teal: calm, trustworthy, passes AA contrast with white text from 600 up.
    brand: {
      50: '#e8f7f5', 100: '#c5ebe6', 200: '#9ddcd4', 300: '#6fcbc0', 400: '#41b8ab',
      500: '#1f9f92', 600: '#0f766e', 700: '#0c5f59', 800: '#0a4a46', 900: '#073633',
    },
    // Warm accent for the selected place and highlights.
    accent: { 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
  },
  semanticTokens: {
    colors: {
      canvas: { default: 'gray.50', _dark: 'gray.900' },
      surface: { default: 'white', _dark: 'gray.800' },
      subtle: { default: 'gray.100', _dark: 'gray.700' },
      line: { default: 'gray.200', _dark: 'whiteAlpha.300' },
      muted: { default: 'gray.600', _dark: 'gray.400' },
      faint: { default: 'gray.500', _dark: 'gray.500' },
      primary: { default: 'brand.600', _dark: 'brand.300' },
      primaryHover: { default: 'brand.700', _dark: 'brand.200' },
      selectedBorder: { default: 'accent.500', _dark: 'accent.400' },
      overlay: { default: 'whiteAlpha.900', _dark: 'blackAlpha.800' },
    },
  },
  radii: { card: '16px', pill: '999px' },
  shadows: {
    card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)',
    lift: '0 8px 24px rgba(16,24,40,.14)',
    sheet: '0 -8px 30px rgba(16,24,40,.18)',
  },
  styles: {
    global: {
      body: { bg: 'canvas', color: 'gray.800', _dark: { color: 'gray.100' } },
      '*:focus-visible': { outline: '3px solid', outlineColor: 'brand.400', outlineOffset: '2px' },
    },
  },
  components: {
    Button: {
      defaultProps: { colorScheme: 'brand' },
      baseStyle: { fontWeight: 600, rounded: 'pill' },
    },
    Badge: { baseStyle: { rounded: 'pill', px: 2, py: '2px', textTransform: 'none', fontWeight: 600 } },
    Input: { defaultProps: { focusBorderColor: 'brand.500' } },
  },
});

export default theme;
