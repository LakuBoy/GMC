import { Avatar, Button, IconButton, Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList, Portal } from '@chakra-ui/react';
import NextLink from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { BiUser } from 'react-icons/bi';

// Sign-in button for guests, menu for signed-in visitors. `compact` is for the phone header.
export default function AccountMenu({ compact, ...props }) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (!user) {
    return compact ? (
      <IconButton
        aria-label="Sign in" icon={<BiUser size={20} />} size="sm" variant="ghost" rounded="full"
        isLoading={status === 'loading'} onClick={() => signIn()} flexShrink={0} {...props}
      />
    ) : (
      <Button size="sm" isLoading={status === 'loading'} onClick={() => signIn()} flexShrink={0} {...props}>
        Sign in
      </Button>
    );
  }

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton} aria-label="Your account" size="sm" variant="ghost" rounded="full" flexShrink={0}
        icon={<Avatar size="sm" name={user.name} bg="brand.600" color="white" />} {...props}
      />
      <Portal>
        <MenuList zIndex={1500} bg="surface" borderColor="line">
          <MenuGroup title={user.name}>
            <MenuItem as={NextLink} href="/account" bg="surface" _hover={{ bg: 'subtle' }} _focus={{ bg: 'subtle' }}>
              Saved places and account
            </MenuItem>
          </MenuGroup>
          <MenuDivider />
          <MenuItem onClick={() => signOut({ redirect: false })} bg="surface" _hover={{ bg: 'subtle' }} _focus={{ bg: 'subtle' }}>
            Sign out
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
}
