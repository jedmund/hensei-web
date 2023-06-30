import React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import type { SliderProps } from '@radix-ui/react-slider'
import classNames from 'classnames'

import styles from './index.module.scss'

interface Props {}

const Slider = React.forwardRef<HTMLDivElement, Props & SliderProps>(
  (props, forwardedRef) => {
    const classes = classNames(
      {
        [styles.slider]: true,
      },
      props.className?.split(' ').map((c) => styles[c])
    )

    return (
      <SliderPrimitive.Slider {...props} className={classes} ref={forwardedRef}>
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb className={styles.thumb} />
      </SliderPrimitive.Slider>
    )
  }
)

Slider.displayName = 'Slider'

export default Slider
