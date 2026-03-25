import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'open-guardrail',
  description: 'Open-source guardrail engine for LLM applications',
  base: '/open-guardrail/',
  head: [
    ['meta', { name: 'theme-color', content: '#6366f1' }],
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      themeConfig: {
        nav: [
          { text: '가이드', link: '/ko/guide/getting-started' },
          { text: '가드', link: '/guards/overview' },
        ],
        sidebar: {
          '/ko/guide/': [
            {
              text: '시작하기',
              items: [
                { text: '소개', link: '/ko/guide/getting-started' },
              ],
            },
          ],
        },
      },
    },
  },
  themeConfig: {
    logo: undefined,
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Guards', link: '/guards/overview' },
      { text: 'Adapters', link: '/adapters/openai' },
      { text: 'Playground', link: '/playground' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'YAML Config', link: '/guide/yaml-config' },
            { text: 'Pipelines', link: '/guide/pipelines' },
            { text: 'Streaming', link: '/guide/streaming' },
            { text: 'Risk-Based Routing', link: '/guide/routing' },
            { text: 'Audit Logging', link: '/guide/audit-logging' },
            { text: 'Custom Guards', link: '/guide/custom-guards' },
            { text: 'Presets', link: '/guide/presets' },
          ],
        },
      ],
      '/guards/': [
        {
          text: 'Guards',
          items: [
            { text: 'Overview', link: '/guards/overview' },
            { text: 'Security', link: '/guards/security' },
            { text: 'Privacy', link: '/guards/privacy' },
            { text: 'Content', link: '/guards/content' },
            { text: 'Format', link: '/guards/format' },
            { text: 'AI Delegation', link: '/guards/ai-delegation' },
            { text: 'Operational', link: '/guards/operational' },
            { text: 'Agent Safety', link: '/guards/agent-safety' },
            { text: 'Korean / ISMS-P', link: '/guards/korean' },
          ],
        },
      ],
      '/adapters/': [
        {
          text: 'SDK Adapters',
          items: [
            { text: 'OpenAI', link: '/adapters/openai' },
            { text: 'Vercel AI SDK', link: '/adapters/vercel-ai' },
            { text: 'LangChain.js', link: '/adapters/langchain' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/wonjangcloud9/open-guardrail' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Lucas',
    },
  },
});
