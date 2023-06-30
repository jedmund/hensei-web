import React from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

import styles from './index.module.scss'
import Button from '~components/common/Button'
import Overlay from '~components/common/Overlay'

// Props
interface Props {
  open: boolean
  title?: string
  message: string | React.ReactNode
  primaryAction?: () => void
  primaryActionText?: string
  primaryActionClassName?: string
  cancelAction: () => void
  cancelActionText: string
}

const Alert = (props: Props) => {
  return (
    <AlertDialog.Root open={props.open}>
      <AlertDialog.Portal>
        <Overlay
          open={props.open}
          visible={true}
          onClick={props.cancelAction}
        />
        <div className={styles.wrapper}>
          <AlertDialog.Content
            className={styles.alert}
            onEscapeKeyDown={props.cancelAction}
          >
            {props.title && (
              <AlertDialog.Title>{props.title}</AlertDialog.Title>
            )}
            <AlertDialog.Description className={styles.description}>
              {props.message}
            </AlertDialog.Description>
            <div className={styles.buttons}>
              <AlertDialog.Cancel asChild>
                <Button
                  bound={true}
                  onClick={props.cancelAction}
                  text={props.cancelActionText}
                />
              </AlertDialog.Cancel>
              {props.primaryAction && (
                <AlertDialog.Action asChild>
                  <Button
                    className={props.primaryActionClassName}
                    bound={true}
                    onClick={props.primaryAction}
                    text={props.primaryActionText}
                  />
                </AlertDialog.Action>
              )}
            </div>
          </AlertDialog.Content>
        </div>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export default Alert
