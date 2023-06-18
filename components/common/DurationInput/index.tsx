import React, { useState, ChangeEvent, KeyboardEvent } from 'react'
import classNames from 'classnames'

import Input from '~components/common/Input'
import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  value: number
  onValueChange: (value: number) => void
}

const DurationInput = React.forwardRef<HTMLInputElement, Props>(
  function DurationInput(
    { className, value, onValueChange, ...props },
    forwardedRef
  ) {
    // State
    const [duration, setDuration] = useState('')
    const [minutesSelected, setMinutesSelected] = useState(false)
    const [secondsSelected, setSecondsSelected] = useState(false)

    // Refs
    const minutesRef = React.createRef<HTMLInputElement>()
    const secondsRef = React.createRef<HTMLInputElement>()

    // Event handlers: On value change
    function handleMinutesChange(event: ChangeEvent<HTMLInputElement>) {
      const minutes = parseInt(event.currentTarget.value)
      const seconds = secondsRef.current
        ? parseInt(secondsRef.current.value)
        : 0

      handleChange(minutes, seconds)
    }

    function handleSecondsChange(event: ChangeEvent<HTMLInputElement>) {
      const seconds = parseInt(event.currentTarget.value)
      const minutes = minutesRef.current
        ? parseInt(minutesRef.current.value)
        : 0

      handleChange(minutes, seconds)
    }

    function handleChange(minutes: number, seconds: number) {
      onValueChange(minutes * 60 + seconds)
    }

    // Event handler: Key presses
    function handleKeyUp(event: KeyboardEvent<HTMLInputElement>) {
      const input = event.currentTarget

      if (input.selectionStart === 0 && input.selectionEnd === 2) {
        if (input === minutesRef.current) {
          setMinutesSelected(true)
        } else if (input === secondsRef.current) {
          setSecondsSelected(true)
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }

      const input = event.currentTarget
      let value = event.currentTarget.value

      // Check if the key that was pressed is the backspace key
      if (event.key === 'Backspace') {
        // Remove the colon if the value is "12:"
        if (value.length === 4) {
          value = value.slice(0, -1)
        }

        // Allow the backspace key to be processed normally
        input.value = value
        return
      }

      // Check if the key that was pressed is the tab key
      if (event.key === 'Tab') {
        // Allow the tab key to be processed normally
        return
      }

      // Check if the key that was pressed is an arrow key
      if (event.key === 'ArrowUp') {
        // Step the value up by one
        value = incrementTime(value)
      } else if (event.key === 'ArrowDown') {
        // Step the value down by one
        value = decrementTime(value)
      } else {
        // Get the character that was entered
        const char = parseInt(event.key)

        // Check if the character is a number
        const isNumber = !isNaN(char)

        // Check if the character should be accepted or rejected
        if (!isNumber || value.length >= 2) {
          // Reject the character if the user doesn't have the entire string selected
          if (!minutesSelected && input === minutesRef.current)
            event.preventDefault()
          else if (
            !secondsSelected &&
            input === secondsRef.current &&
            getSeconds() > 9
          )
            event.preventDefault()
          else {
            setDuration(value)
            setMinutesSelected(false)
            setSecondsSelected(false)
          }
        } else {
          setDuration(value)
        }
      }
    }

    // Methods: Time manipulation
    function incrementTime(time: string): string {
      // Split the time into minutes and seconds
      let [minutes, seconds] = time.split(':').map(Number)

      // Increment the seconds
      seconds += 1

      // Check if the seconds have overflowed into the next minute
      if (seconds >= 60) {
        minutes += 1
        seconds = 0
      }

      // Format the time as a string and return it
      return `${minutes}:${seconds}`
    }

    function decrementTime(time: string): string {
      // Split the time into minutes and seconds
      let [minutes, seconds] = time.split(':').map(Number)

      // Decrement the seconds
      seconds -= 1

      // Check if the seconds have underflowed into the previous minute
      if (seconds < 0) {
        minutes -= 1
        seconds = 59
      }

      // Check if the minutes have underflowed into the previous hour
      if (minutes < 0) {
        minutes = 59
      }

      // Format the time as a string and return it
      return `${minutes}:${seconds}`
    }

    // Methods: Miscellaneous

    function getMinutes() {
      const minutes = Math.floor(value / 60)
      return minutes
    }

    function getSeconds() {
      const seconds = value % 60
      return seconds
    }

    return (
      <div className={classNames(className, { Duration: true })}>
        <Input
          ref={minutesRef}
          type="text"
          className={classNames(
            {
              AlignRight: true,
            },
            className
          )}
          value={getMinutes()}
          onChange={handleMinutesChange}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          placeholder="mm"
          size={3}
          tabIndex={props.tabIndex}
        />
        <span>:</span>
        <Input
          ref={secondsRef}
          type="text"
          className={classNames(
            {
              AlignRight: true,
            },
            className
          )}
          value={getSeconds() > 0 ? `${getSeconds()}`.padStart(2, '0') : ''}
          onChange={handleSecondsChange}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          placeholder="ss"
          size={2}
          tabIndex={props.tabIndex ? props.tabIndex + 1 : undefined}
        />
      </div>
    )
  }
)

export default DurationInput
