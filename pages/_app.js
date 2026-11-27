import '@fontsource-variable/plus-jakarta-sans';
import { ChakraProvider } from '@chakra-ui/react';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import { FavoritesProvider } from '../components/Favorites';
import theme from '../theme';

export default function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <SessionProvider session={pageProps.session}>
        <FavoritesProvider>
          <Component {...pageProps} />
        </FavoritesProvider>
      </SessionProvider>
    </ChakraProvider>
  );
}
