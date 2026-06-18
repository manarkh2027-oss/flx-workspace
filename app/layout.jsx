import './globals.css';
import './pages.css';
import I18nClient from '@/components/I18nClient';
import ThemeClient from '@/components/ThemeClient';

const themeInit = `try{var t=localStorage.getItem('flx-theme')||'light';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}`;

export const metadata = {
  title: 'FLX Workspace',
  description: 'FLX Workspace — review and approve your creative work.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <I18nClient />
        <ThemeClient />
      </body>
    </html>
  );
}
