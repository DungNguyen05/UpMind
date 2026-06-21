import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'CP-Tutor',
  description: 'Online Judge + AI Mentor cho C++ Competitive Programming',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Script id="reset-scroll-on-reload" strategy="beforeInteractive">
          {`
            (function () {
              var entry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
              var isReload = entry
                ? entry.type === 'reload'
                : performance.navigation && performance.navigation.type === 1;

              if (!isReload) return;

              var previousScrollRestoration = 'auto';
              if ('scrollRestoration' in history) {
                previousScrollRestoration = history.scrollRestoration;
                history.scrollRestoration = 'manual';
              }

              var resetScroll = function () {
                document.documentElement.scrollTop = 0;
                if (document.body) document.body.scrollTop = 0;
                window.scrollTo(0, 0);
              };

              var restoreScrollMode = function () {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = previousScrollRestoration || 'auto';
                }
              };

              resetScroll();
              document.addEventListener('DOMContentLoaded', resetScroll, { once: true });
              window.addEventListener('pageshow', function () {
                resetScroll();
                requestAnimationFrame(resetScroll);
                setTimeout(resetScroll, 50);
              }, { once: true });
              window.addEventListener('load', function () {
                resetScroll();
                requestAnimationFrame(resetScroll);
                setTimeout(resetScroll, 50);
                setTimeout(resetScroll, 250);
                setTimeout(restoreScrollMode, 350);
              }, { once: true });
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}
