import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Observer',
  tagline: 'Баримт бичиг ба техникийн лавлах',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://example.com',
  baseUrl: '/',

  organizationName: 'observer-experiment',
  projectName: 'observer-experiment',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../documentation',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'project',
        path: '../docs',
        routeBasePath: 'project-docs',
        sidebarPath: './sidebars-project.ts',
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Observer',
      logo: {
        alt: 'Observer',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          docsPluginId: 'default',
          sidebarId: 'referenceSidebar',
          position: 'left',
          label: 'Лавлах',
        },
        {
          type: 'docSidebar',
          docsPluginId: 'project',
          sidebarId: 'projectSidebar',
          position: 'left',
          label: 'Төсөл (docs/)',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Лавлах',
          items: [
            {
              label: 'Талбарууд — ерөнхий',
              to: '/docs/reference/fields/overview',
            },
            {
              label: 'API',
              to: '/docs/reference/api',
            },
          ],
        },
        {
          title: 'Төсөл',
          items: [
            {
              label: 'Research field map',
              to: '/project-docs/research_field_map',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Observer documentation.`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
