import type { Preview } from '@storybook/sveltekit';
import '$src/app.scss';
import './storybook-overrides.css';

const preview: Preview = {
    parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},
		viewport: {
			options: {
				phone: { name: 'Phone', styles: { width: '375px', height: '667px' } },
				tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
				laptop: { name: 'Laptop', styles: { width: '1280px', height: '800px' } },
				desktop: { name: 'Desktop', styles: { width: '1920px', height: '1080px' } }
			}
		},
		backgrounds: {
            options: {
                light: { name: 'light', value: '#f5f5f5' },
                dark: { name: 'dark', value: '#191919' },
                "card-light": { name: 'card-light', value: '#ffffff' },
                "card-dark": { name: 'card-dark', value: '#212121' }
            }
        },
		docs: {
			toc: true
		}
	},

    globalTypes: {
		theme: {
			name: 'Theme',
			description: 'Global theme for components',
			defaultValue: 'light',
			toolbar: {
				icon: 'circlehollow',
				items: ['light', 'dark'],
				showName: true
			}
		}
	},

    initialGlobals: {
        backgrounds: {
            value: 'light'
        }
    }
};

export default preview;