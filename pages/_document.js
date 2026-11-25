import { ColorModeScript } from '@chakra-ui/react';
import { Head, Html, Main, NextScript } from 'next/document';
import theme from '../theme';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#0f766e" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z' fill='%230f766e'/%3E%3Ccircle cx='12' cy='9' r='2.6' fill='%23fff'/%3E%3C/svg%3E" />
      </Head>
      <body>
        {/* Sets the saved or system color mode before first paint, so there is no light flash in dark mode. */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
