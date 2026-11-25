import '@fontsource-variable/plus-jakarta-sans';
import { ChakraProvider } from '@chakra-ui/react';
import '../styles/globals.css';
import theme from '../theme';

export default function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
