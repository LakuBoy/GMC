import { Box, Button, Text, VStack } from '@chakra-ui/react';

// Small friendly illustrations (inline SVG, no image downloads).
const ART = {
  empty: (
    <svg viewBox="0 0 120 90" width="140" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="6" fill="currentColor" opacity=".08" />
      <path d="M60 10c-14 0-25 11-25 25 0 19 25 43 25 43s25-24 25-43c0-14-11-25-25-25z" fill="#0f766e" opacity=".15" />
      <path d="M60 14c-12 0-21 9-21 21 0 16 21 37 21 37s21-21 21-37c0-12-9-21-21-21z" fill="none" stroke="#0f766e" strokeWidth="3" />
      <circle cx="60" cy="35" r="8" fill="none" stroke="#0f766e" strokeWidth="3" />
      <path d="M92 20l4 4m0-4l-4 4" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 120 90" width="140" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="6" fill="currentColor" opacity=".08" />
      <circle cx="60" cy="42" r="28" fill="#f97316" opacity=".15" />
      <circle cx="60" cy="42" r="22" fill="none" stroke="#ea580c" strokeWidth="3" />
      <path d="M60 30v14" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="53" r="2.6" fill="#ea580c" />
    </svg>
  ),
  zoom: (
    <svg viewBox="0 0 120 90" width="140" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="6" fill="currentColor" opacity=".08" />
      <circle cx="54" cy="38" r="22" fill="#0f766e" opacity=".15" />
      <circle cx="54" cy="38" r="18" fill="none" stroke="#0f766e" strokeWidth="3" />
      <path d="M67 51l18 18" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" />
      <path d="M46 38h16M54 30v16" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export default function EmptyState({ kind = 'empty', title, children, action }) {
  return (
    <VStack spacing={3} py={10} px={6} textAlign="center" color="muted" role="status">
      <Box color="gray.500">{ART[kind]}</Box>
      <Text fontWeight={700} fontSize="lg" color="inherit" _dark={{ color: 'gray.100' }}>{title}</Text>
      <Text fontSize="sm" maxW="300px">{children}</Text>
      {action && <Button size="sm" onClick={action.onClick}>{action.label}</Button>}
    </VStack>
  );
}
