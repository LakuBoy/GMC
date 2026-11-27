import { Alert, AlertDescription, AlertIcon, Box, Button, Flex, FormControl, FormLabel, Input, Text } from '@chakra-ui/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getProviders, signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { IoLogoGoogle } from 'react-icons/io5';
import PageShell from '../components/PageShell';

const ERRORS = {
  Verification: 'That sign-in link has expired or was already used. Ask for a new one.',
  OAuthAccountNotLinked: 'This email already signs in another way. Use the method you used the first time.',
};

// Only ever return to a page on this site.
function safeReturn(url) {
  if (typeof window === 'undefined' || !url) return '/';
  try {
    const u = new URL(String(url), window.location.origin);
    return u.origin === window.location.origin ? `${u.pathname}${u.search}` : '/';
  } catch {
    return '/';
  }
}

export default function SignIn() {
  const router = useRouter();
  const { status } = useSession();
  const [providers, setProviders] = useState(undefined); // undefined: loading
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const callbackUrl = safeReturn(router.query.callbackUrl);
  const error = router.query.error;

  useEffect(() => { getProviders().then(setProviders).catch(() => setProviders(null)); }, []);
  useEffect(() => {
    if (router.isReady && status === 'authenticated') router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  function sendLink(e) {
    e.preventDefault();
    setBusy(true);
    signIn('email', { email: email.trim(), callbackUrl });
  }

  const none = providers !== undefined && !providers?.google && !providers?.email;

  return (
    <>
      <Head><title>Sign in · Places nearby</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <PageShell>
        <Box>
          <Text as="h1" fontSize="2xl" fontWeight={800}>Sign in</Text>
          <Text color="muted" mt={1}>
            Sign in to save places, write reviews and confirm what is still open. You can browse without an account.
          </Text>
        </Box>

        {error && (
          <Alert status="error" rounded="lg" fontSize="sm">
            <AlertIcon /><AlertDescription>{ERRORS[error] || 'Sign-in did not work. Please try again.'}</AlertDescription>
          </Alert>
        )}

        {router.query.sent ? (
          <Alert status="success" rounded="lg" fontSize="sm">
            <AlertIcon />
            <AlertDescription>
              Your sign-in link is ready. In this development version it is printed in the server log.
            </AlertDescription>
          </Alert>
        ) : (
          <Flex direction="column" gap={4} bg="surface" p={5} rounded="card" shadow="card">
            {providers?.google && (
              <Button leftIcon={<IoLogoGoogle />} variant="outline" borderColor="line" onClick={() => signIn('google', { callbackUrl })}>
                Continue with Google
              </Button>
            )}
            {providers?.email && (
              <form onSubmit={sendLink}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Email address</FormLabel>
                  <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </FormControl>
                <Button type="submit" width="full" mt={3} isLoading={busy}>Get a sign-in link</Button>
              </form>
            )}
            {none && <Text fontSize="sm" color="muted">Sign-in is not set up on this server yet.</Text>}
          </Flex>
        )}
      </PageShell>
    </>
  );
}
