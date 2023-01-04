import React, { useState, ChangeEvent, KeyboardEvent, useEffect } from 'react'
import classNames from 'classnames'

import Input from '~components/Input'

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
    { className, placeholder, value, onValueChange },
    forwardedRef
  ) {
    const [duration, setDuration] = useState('')

    useEffect(() => {
      if (value > 0) setDuration(convertSecondsToString(value))
    }, [value])

    function convertStringToSeconds(string: string) {
      const parts = string.split(':')
      const minutes = parseInt(parts[0])
      const seconds = parseInt(parts[1])

      return minutes * 60 + seconds
    }

    function convertSecondsToString(value: number) {
      const minutes = Math.floor(value / 60)
      const seconds = value - minutes * 60

      const paddedMinutes = padNumber(`${minutes}`, '0', 2)

      return `${paddedMinutes}:${seconds}`
    }

    function padNumber(string: string, pad: string, length: number) {
      return (new Array(length + 1).join(pad) + string).slice(-length)
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const value = event.currentTarget.value
      const durationInSeconds = convertStringToSeconds(value)
      onValueChange(durationInSeconds)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        // Allow the key to be processed normally
        return
      }

      // Get the current value
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
        if (!isNumber || value.length >= 5) {
          // Reject the character
          event.preventDefault()
        } else if (value.length === 2) {
          // Insert a colon after the second digit
          input.value = value + ':'
        }
      }
    }

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

    return (
      <Input
        type="text"
        className={classNames(
          {
            Duration: true,
            AlignRight: true,
          },
          className
        )}
        value={duration}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    )
  }
)

export default DurationInput
