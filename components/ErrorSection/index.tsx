import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'

import Button from '~components/common/Button'
import { ResponseStatus } from '~types'

import styles from './index.module.scss'

interface Props {
  status: ResponseStatus
}

const ErrorSection = ({ status }: Props) => {
  // Import translations
  const { t } = useTranslation('common')

  const [statusText, setStatusText] = useState('')

  useEffect(() => {
    setStatusText(status.text.replaceAll(' ', '_').toLowerCase())
  }, [status.text])

  const errorBody = () => {
    return (
      <>
        <div className="Code">{status.code}</div>
        <h1>{t(`errors.${statusText}.title`)}</h1>
        <p>{t(`errors.${statusText}.description`)}</p>
      </>
    )
  }

  return (
    <section className="Error">
      {errorBody()}
      {[401, 404].includes(status.code) ? (
        <Link href="/new">
          <Button text={t('errors.not_found.button')} />
        </Link>
      ) : (
        ''
      )}
    </section>
  )
}

export default ErrorSection
