import type { StorybookConfig } from '@storybook/sveltekit';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
	stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook',
		{
			name: '@storybook/addon-docs',
			options: {
				mdxPluginOptions: {
					mdxCompileOptions: {
						remarkPlugins: [remarkGfm]
					}
				}
			}
		},
		'@storybook/addon-a11y',
		'@storybook/addon-vitest'
	],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	staticDirs: ['../static']
};

export default config;