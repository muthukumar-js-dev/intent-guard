import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "Intent Guard",
    description: "Prevent AI coding assistants from breaking your architecture. Validates AI-generated code against layer boundaries, protected regions, and dependency rules.",
    base: '/intent-guard/', // Assuming GitHub Pages deployment to repository root
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Get Started', link: '/guide/getting-started' },
            { text: 'Docs', link: '/introduction/' },
            { text: 'GitHub', link: 'https://github.com/muthu-kumar369/intent-guard' }
        ],

        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'What is Intent Guard?', link: '/introduction/' },
                    { text: 'Why Intent Guard?', link: '/introduction/why-intent-guard' }
                ]
            },
            {
                text: 'Getting Started',
                items: [
                    { text: 'Quick Start', link: '/guide/getting-started' },
                    { text: 'Core Concepts', link: '/guide/core-concepts' },
                    { text: 'Best Practices', link: '/guide/best-practices' }
                ]
            },
            {
                text: 'Guides',
                items: [
                    { text: 'Configuration Guide', link: '/guide/configuration-guide' },
                    { text: 'AI Integration', link: '/guide/ai-integration' },
                    { text: 'Examples & Use Cases', link: '/guide/examples' },
                    { text: 'Troubleshooting', link: '/guide/troubleshooting' }
                ]
            },
            {
                text: 'Reference',
                items: [
                    { text: 'Configuration Schema', link: '/configuration' },
                    { text: 'Advanced Configuration', link: '/advanced-configuration' },
                    { text: 'CLI Reference', link: '/cli-reference' },
                    { text: 'Parser Features', link: '/parser-features' },
                    { text: 'Performance', link: '/performance' },
                    { text: 'FAQ', link: '/faq' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/muthu-kumar369/intent-guard' }
        ],

        search: {
            provider: 'local'
        },

        footer: {
            message: 'Released under the PROPRIETARY License.',
            copyright: 'Copyright © 2024-present Muthu Kumar'
        }
    },
    head: [
        ['link', { rel: 'icon', href: '/intent-guard/favicon.ico' }], // Placeholder
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:locale', content: 'en_US' }],
        ['meta', { property: 'og:site_name', content: 'Intent Guard' }],
        ['meta', { property: 'og:image', content: 'https://muthu-kumar369.github.io/intent-guard/og-image.png' }],
    ]
})
