import { Box } from '@chakra-ui/react';

// Category look shared by pins, tiles and the detail hero. Paths are 24x24 stroke icons.
export const CATEGORY_META = {
  restaurants: {
    label: 'Restaurants', color: '#0f766e', soft: 'brand.50', softDark: 'whiteAlpha.200',
    path: 'M7 3v8M4 3v5a3 3 0 003 3M10 3v5a3 3 0 01-3 3M7 11v10M17 21V3c-2.5 1.5-3.5 4-3.5 7v3H17',
  },
  hotels: {
    label: 'Hotels', color: '#2b6cb0', soft: 'blue.50', softDark: 'whiteAlpha.200',
    path: 'M3 19V6M3 14h18v5M21 14v-3a3 3 0 00-3-3h-7v6M7 11.5h.01',
  },
  attractions: {
    label: 'Attractions', color: '#7c3aed', soft: 'purple.50', softDark: 'whiteAlpha.200',
    path: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  },
};

export const metaOf = (category) => CATEGORY_META[category] || CATEGORY_META.attractions;

// A map pin as an HTML string for Leaflet divIcons.
export function pinHtml(category, size, color) {
  const m = metaOf(category);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 1.5C8 1.5 4.8 4.7 4.8 8.7c0 5.4 7.2 13.8 7.2 13.8s7.2-8.4 7.2-13.8c0-4-3.2-7.2-7.2-7.2z" fill="${color || m.color}" stroke="#fff" stroke-width="1.4"/>
    <g transform="translate(6.6 3.3) scale(.45)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${m.path}"/></g></svg>`;
}

export function CategoryIcon({ category, size = 22, ...rest }) {
  const m = metaOf(category);
  return (
    <Box as="svg" viewBox="0 0 24 24" width={`${size}px`} height={`${size}px`} fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={m.path} />
    </Box>
  );
}

// Rounded colored tile used where a photo will go (photos arrive in a later phase).
export function CategoryTile({ category, size = 56 }) {
  const m = metaOf(category);
  return (
    <Box
      flexShrink={0} width={`${size}px`} height={`${size}px`} rounded="14px" display="grid" placeItems="center"
      color="white" bgGradient={`linear(to-br, ${m.color}, ${m.color}cc)`}
    >
      <CategoryIcon category={category} size={size * 0.46} />
    </Box>
  );
}

export function Logo({ size = 26 }) {
  return (
    <Box as="svg" viewBox="0 0 24 24" width={`${size}px`} height={`${size}px`} aria-hidden="true" flexShrink={0}>
      <path d="M12 1.5C8 1.5 4.8 4.7 4.8 8.7c0 5.4 7.2 13.8 7.2 13.8s7.2-8.4 7.2-13.8c0-4-3.2-7.2-7.2-7.2z" fill="#0f766e" />
      <circle cx="12" cy="8.7" r="2.8" fill="#fff" />
    </Box>
  );
}
