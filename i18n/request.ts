import {getRequestConfig} from 'next-intl/server'
import {routing} from './routing'
import {type Locale} from '../i18n.config'

// next-intl v4: global request config used by getMessages()
export default getRequestConfig(async ({requestLocale}) => {
  let locale = (await requestLocale) as Locale | null;
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  // Load only i18n namespaces; exclude content data with dotted keys
  const common = (await import(`../public/locales/${locale}/common.json`)).default;
  const about = (await import(`../public/locales/${locale}/about.json`)).default;
  // Re-include updates.json now that dotted version keys have been renamed (e.g., v1_2_1)
  const updates = (await import(`../public/locales/${locale}/updates.json`)).default;
  const messages = {common, about, updates} as const;

  return {locale, messages};
});
