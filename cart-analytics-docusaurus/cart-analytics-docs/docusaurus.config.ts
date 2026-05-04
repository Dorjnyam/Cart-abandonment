import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Cart Analytics Docs',
  tagline: 'Системийн үйлчилгээний техникийн баримт бичиг',
  favicon: 'img/favicon.ico',
  url: 'https://docs.cartanalytics.mn',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  future: {
    faster: {
      rspackBundler: false,
      swcJsLoader: false,
      swcJsMinimizer: false,
      swcHtmlMinimizer: false,
      lightningCssMinimizer: false,
      mdxCrossCompilerCache: false,
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: '📚 Cart Analytics Docs',
      items: [
        { type: 'docSidebar', sidebarId: 'overviewSidebar', position: 'left', label: '🗺️ Тойм' },
        { type: 'docSidebar', sidebarId: 'webSidebar', position: 'left', label: '🌐 Web Apps' },
        { type: 'docSidebar', sidebarId: 'servicesSidebar', position: 'left', label: '⚙️ Services' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Cart Analytics.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'python', 'sql', 'json', 'typescript'],
    },
    colorMode: { defaultMode: 'dark', disableSwitch: false },
  } satisfies Preset.ThemeConfig,
};

export default config;
