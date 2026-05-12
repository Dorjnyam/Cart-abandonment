import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Сагс орхилтын шинжилгээ',
  tagline: 'Дипломын ажлын MVP системийн Монгол баримт бичиг',
  favicon: 'img/favicon.ico',
  url: 'https://docs.cartanalytics.mn',
  baseUrl: '/',
  onBrokenLinks: 'warn',
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
  i18n: { defaultLocale: 'mn', locales: ['mn'] },
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
      title: 'Сагс орхилтын шинжилгээ',
      items: [
        { type: 'docSidebar', sidebarId: 'thesisSidebar', position: 'left', label: 'Thesis MVP' },
        { type: 'docSidebar', sidebarId: 'overviewSidebar', position: 'left', label: 'Legacy overview' },
        { type: 'docSidebar', sidebarId: 'webSidebar', position: 'left', label: 'Web apps' },
        { type: 'docSidebar', sidebarId: 'servicesSidebar', position: 'left', label: 'Services' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Cart Analytics Thesis MVP.`,
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
