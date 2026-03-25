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
              text: '가이드',
              items: [
                { text: '시작하기', link: '/ko/guide/getting-started' },
                { text: '파이프라인', link: '/ko/guide/pipelines' },
                { text: '커스텀 가드', link: '/ko/guide/custom-guards' },
                { text: '가드 유틸리티', link: '/ko/guide/guard-utils' },
              ],
            },
          ],
          '/ko/guards/': [
            {
              text: '가드',
              items: [
                { text: '한국 / ISMS-P', link: '/ko/guards/korean' },
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
            { text: 'Guard Utilities', link: '/guide/guard-utils' },
            { text: 'Plugins', link: '/guide/plugins' },
            { text: 'API Reference', link: '/guide/api-reference' },
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
            { text: 'Anthropic (Claude)', link: '/adapters/anthropic' },
            { text: 'Vercel AI SDK', link: '/adapters/vercel-ai' },
            { text: 'LangChain.js', link: '/adapters/langchain' },
            { text: 'Express', link: '/adapters/express' },
            { text: 'Fastify', link: '/adapters/fastify' },
            { text: 'Hono', link: '/adapters/hono' },
            { text: 'Next.js', link: '/adapters/nextjs' },
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
