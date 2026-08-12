import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * The HTML shell wrapped around every statically-rendered web route.
 *
 * This is what turns the export into an installable PWA: the manifest link,
 * the theme colour, and the iOS-only meta tags (iOS ignores the manifest's
 * display and icon fields, so "Add to Home Screen" needs its own set).
 *
 * Runs in Node at export time only - no browser APIs here.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* Title and description live in app/_layout.tsx - expo-router emits
            its own <title> ahead of anything here, and the browser wins on
            the first one. */}

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#07A4E7" />

        {/* iOS: standalone display and the home-screen icon come from here,
            not from the manifest. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ultimate Fitness" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />

        {/* Keeps the body from scrolling behind the app's own ScrollViews. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

/** White under the app so there's no flash of black on launch. */
const responsiveBackground = `
body {
  background-color: #FFFFFF;
}
`;
