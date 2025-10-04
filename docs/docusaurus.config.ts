import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { themes as prismThemes } from "prism-react-renderer"

const config: Config = {
  title: "Proton",
  tagline: "DOM-first, Signal-based UI Framework | ~5kb gzipped, Zero config, Rootless components",
  favicon: "img/logo.svg",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://denshya.github.io/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/proton",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "denshya", // Usually your GitHub org/user name.
  projectName: "proton", // Usually your repo name.

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/denshya/proton/tree/main/docs",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "Proton",
      logo: {
        alt: "Proton Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "learn",
          position: "left",
          label: "Learn",
        },
        // {
        //   type: "docSidebar",
        //   sidebarId: "learn",
        //   position: "left",
        //   label: "Usage",
        // },
        {
          type: "docSidebar",
          sidebarId: "demos",
          position: "left",
          label: "Demos",
        },
        {
          type: "doc",
          docId: "specification",
          position: "left",
          label: "Specification",
        },
        {
          type: "doc",
          docId: "benchmarks",
          position: "left",
          label: "Benchmarks",
        },
        {
          type: "doc",
          docId: "api-reference",
          position: "left",
          label: "API",
        },
        {
          href: "https://github.com/denshya/proton",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Getting Started",
              to: "/learn/learn",
            },
            {
              label: "API Reference",
              to: "/api-reference",
            },
            {
              label: "Migration Guide",
              to: "/learn/migration-guide",
            },
            {
              label: "Specification",
              to: "/specification",
            },
          ],
        },
        {
          title: "Examples",
          items: [
            {
              label: "Interactive Demos",
              to: "/demos/demos",
            },
            {
              label: "StackBlitz Playground",
              href: "https://stackblitz.com/@FrameMuse/collections/proton",
            },
            {
              label: "GitHub Examples",
              href: "https://github.com/denshya/proton/tree/main/demos",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub Discussions",
              href: "https://github.com/denshya/proton/discussions",
            },
            {
              label: "Discord",
              href: "https://discordapp.com/invite/sHp2pxrSws",
            },
            {
              label: "Issues",
              href: "https://github.com/denshya/proton/issues",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/denshya/proton",
            },
            {
              label: "NPM Package",
              href: "https://www.npmjs.com/package/@denshya/proton",
            },
            {
              label: "Benchmarks",
              to: "/benchmarks",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Proton Contributors. Built with ❤️ and TypeScript.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
