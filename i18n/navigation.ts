import {createNavigation} from 'next-intl/navigation'
import {locales, defaultLocale} from '../i18n.config'

export const {Link, useRouter, usePathname} = createNavigation({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
})

