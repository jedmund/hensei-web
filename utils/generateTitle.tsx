import { useTranslation } from 'next-i18next'

export default function generateTitle(
  element?: string,
  username?: string,
  name?: string
) {
  const { t } = useTranslation('common')

  const teamName = name ? name : t('no_title')
  const userName = username ? `@${username}` : t('no_user')

  const title = t('page.titles.team', {
    username: userName,
    teamName: teamName,
    emoji: element,
  })

  return title
}
