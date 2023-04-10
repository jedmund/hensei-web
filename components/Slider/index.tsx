import React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import type { SliderProps } from '@radix-ui/react-slider'
import classNames from 'classnames'

import './index.scss'

interface Props {}

const Slider = React.forwardRef<HTMLDivElement, Props & SliderProps>(
  (props, forwardedRef) => {
    const value = props.value || props.defaultValue

    return (
      <SliderPrimitive.Slider
        {...props}
        className={classNames({ Slider: true }, props.className)}
        ref={forwardedRef}
      >
        <SliderPrimitive.Track className="SliderTrack">
          <SliderPrimitive.Range className="SliderRange" />
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb className="SliderThumb" />
      </SliderPrimitive.Slider>
    )
  }
)

Slider.displayName = 'Slider'

export default Slider
