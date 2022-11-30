import React from "react"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"

import classNames from "classnames"

import PlusIcon from "~public/icons/Add.svg"

import "./index.scss"

// Props
interface Props {
  skill?: JobSkill
  editable: boolean
  hasJob: boolean
}

const JobSkillItem = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  const router = useRouter()
  const { t } = useTranslation("common")
  const locale =
    router.locale && ["en", "ja"].includes(router.locale) ? router.locale : "en"

  const classes = classNames({
    JobSkill: true,
    editable: props.editable,
  })

  const imageClasses = classNames({
    placeholder: !props.skill,
    editable: props.editable && props.hasJob,
  })

  const skillImage = () => {
    let jsx: React.ReactNode

    if (props.skill) {
      jsx = (
        <img
          alt={props.skill.name[locale]}
          className={imageClasses}
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}job-skills/${props.skill.slug}.png`}
        />
      )
    } else {
      jsx = (
        <div className={imageClasses}>
          {props.editable && props.hasJob ? <PlusIcon /> : ""}
        </div>
      )
    }

    return jsx
  }

  const label = () => {
    let jsx: React.ReactNode

    if (props.skill) {
      jsx = <p>{props.skill.name[locale]}</p>
    } else if (props.editable && props.hasJob) {
      jsx = <p className="placeholder">Select a skill</p>
    } else {
      jsx = <p className="placeholder">No skill</p>
    }

    return jsx
  }

  const skillItem = () => {
    return (
      <div className={classes} ref={ref}>
        {skillImage()}
        {label()}
      </div>
    )
  }

  return skillItem()
})

export default JobSkillItem
