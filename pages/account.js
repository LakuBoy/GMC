import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Box, Button, Flex, FormControl, FormHelperText, FormLabel, Input, Link, Spinner, Text, useDisclosure, useToast,
} from '@chakra-ui/react';
import Head from 'next/head';
import NextLink from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { SaveButton, useFavorites } from '../components/Favorites';
import { CategoryTile } from '../components/icons';
import PageShell from '../components/PageShell';
import { api } from '../lib/community-client';

export default function Account() {
  const { data: session, status, update } = useSession();
  const { saved, loading } = useFavorites();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const dialog = useDisclosure();
  const cancelRef = useRef(null);
  const current = session?.user?.name;

  useEffect(() => { if (current) setName(current); }, [current]);

  const tell = (title, kind = 'success') => toast({ title, status: kind, duration: 3000, position: 'top' });

  async function saveName(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/me', 'PATCH', { displayName: name });
      await update();
      tell('Name updated');
    } catch (err) {
      tell(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function removeAccount() {
    try {
      await api('/api/me', 'DELETE');
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      dialog.onClose();
      tell(err.message, 'error');
    }
  }

  return (
    <>
      <Head><title>Your account · Places nearby</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <PageShell>
        {status === 'loading' && <Spinner color="primary" alignSelf="center" />}

        {status === 'unauthenticated' && (
          <Box bg="surface" p={5} rounded="card" shadow="card">
            <Text mb={3}>Sign in to see your saved places.</Text>
            <Button onClick={() => signIn(undefined, { callbackUrl: '/account' })}>Sign in</Button>
          </Box>
        )}

        {session && (
          <>
            <Text as="h1" fontSize="2xl" fontWeight={800}>Your account</Text>

            <Box as="section">
              <Text as="h2" fontWeight={800} mb={2}>Saved places</Text>
              {loading && <Spinner size="sm" color="primary" />}
              {!loading && !saved.length && (
                <Text color="muted" fontSize="sm">Nothing saved yet. Press the heart on a place to keep it here.</Text>
              )}
              <Flex direction="column" gap={2}>
                {saved.map((f) => (
                  <Flex key={f.placeId} align="center" gap={3} p={3} bg="surface" rounded="card" shadow="card">
                    <CategoryTile category={f.category} size={40} />
                    <Box flex={1} minW={0}>
                      <Link as={NextLink} href={`/place/${f.placeId.replace('/', '-')}`} fontWeight={700}>{f.name}</Link>
                      {f.kind && <Text fontSize="sm" color="muted" textTransform="capitalize">{f.kind}</Text>}
                    </Box>
                    <SaveButton place={{ ...f, id: f.placeId }} color="primary" />
                  </Flex>
                ))}
              </Flex>
            </Box>

            <Box as="form" onSubmit={saveName} bg="surface" p={4} rounded="card" shadow="card">
              <FormControl isRequired>
                <FormLabel fontSize="sm">Name shown on your reviews</FormLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
                <FormHelperText>Your email address ({session.user.email}) is never shown to others.</FormHelperText>
              </FormControl>
              <Button type="submit" size="sm" mt={3} isLoading={busy} isDisabled={name.trim() === current}>Save name</Button>
            </Box>

            <Flex justify="space-between" wrap="wrap" gap={2}>
              <Button variant="outline" borderColor="line" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</Button>
              <Button variant="ghost" colorScheme="red" size="sm" onClick={dialog.onOpen}>Delete my account</Button>
            </Flex>
          </>
        )}

        <AlertDialog isOpen={dialog.isOpen} onClose={dialog.onClose} leastDestructiveRef={cancelRef} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent mx={4} bg="surface">
              <AlertDialogHeader>Delete your account?</AlertDialogHeader>
              <AlertDialogBody>
                This removes your saved places, reviews, confirmations and votes. It cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter gap={2}>
                <Button ref={cancelRef} onClick={dialog.onClose} variant="ghost">Keep account</Button>
                <Button colorScheme="red" onClick={removeAccount}>Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </PageShell>
    </>
  );
}
