import { IconButton, useColorMode } from '@chakra-ui/react';
import { BiMoon, BiSun } from 'react-icons/bi';

export default function ColorModeToggle(props) {
  const { colorMode, toggleColorMode } = useColorMode();
  const dark = colorMode === 'dark';
  return (
    <IconButton
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      icon={dark ? <BiSun size={20} /> : <BiMoon size={20} />}
      onClick={toggleColorMode} variant="ghost" rounded="full" {...props}
    />
  );
}
