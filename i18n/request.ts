import {getRequestConfig} from 'next-intl/server'
import {locales, defaultLocale, type Locale} from '../i18n.config'

// next-intl v4: global request config used by getMessages()
export default getRequestConfig(async ({requestLocale}) => {
  let locale = (await requestLocale) as Locale | null;
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  // Load only i18n namespaces; exclude content data with dotted keys
  const common = (await import(`../public/locales/${locale}/common.json`)).default;
  const about = (await import(`../public/locales/${locale}/about.json`)).default;
  const messages = {common, about} as const;

  return {locale, messages};
});
