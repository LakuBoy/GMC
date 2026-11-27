import { Button, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { BiArrowBack } from 'react-icons/bi';
import ColorModeToggle from './ColorModeToggle';
import { Logo } from './icons';

// Header and column for the pages that are not the map.
export default function PageShell({ children, right }) {
  return (
    <Flex direction="column" minH="100dvh">
      <Flex as="header" align="center" justify="space-between" px={4} py={3} bg="surface" borderBottomWidth="1px" borderColor="line">
        <Button as={NextLink} href="/" leftIcon={<BiArrowBack />} variant="ghost" size="sm">
          <Flex align="center" gap={2}><Logo size={20} /><Text fontWeight={800}>Places nearby</Text></Flex>
        </Button>
        <Flex gap={2} align="center"><ColorModeToggle size="sm" />{right}</Flex>
      </Flex>
      <Flex as="main" direction="column" gap={4} width="full" maxW="560px" mx="auto" px={4} py={6}>
        {children}
      </Flex>
    </Flex>
  );
}
