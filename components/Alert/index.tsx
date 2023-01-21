import React from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

import './index.scss'
import Button from '~components/Button'
import Overlay from '~components/Overlay'

// Props
interface Props {
  open: boolean
  title?: string
  message: string | React.ReactNode
  primaryAction?: () => void
  primaryActionText?: string
  cancelAction: () => void
  cancelActionText: string
}

const Alert = (props: Props) => {
  return (
    <AlertDialog.Root open={props.open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="Overlay" onClick={props.cancelAction} />
        <div className="AlertWrapper">
          <AlertDialog.Content className="Alert">
            {props.title ? <AlertDialog.Title>Error</AlertDialog.Title> : ''}
            <AlertDialog.Description className="description">
              {props.message}
            </AlertDialog.Description>
            <div className="buttons">
              <AlertDialog.Cancel asChild>
                <Button
                  contained={true}
                  onClick={props.cancelAction}
                  text={props.cancelActionText}
                />
              </AlertDialog.Cancel>
              {props.primaryAction ? (
                <AlertDialog.Action asChild>
                  <Button
                    contained={true}
                    onClick={props.primaryAction}
                    text={props.primaryActionText}
                  />
                </AlertDialog.Action>
              ) : (
                ''
              )}
            </div>
          </AlertDialog.Content>
        </div>
        <Overlay open={props.open} visible={true} />
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export default Alert
