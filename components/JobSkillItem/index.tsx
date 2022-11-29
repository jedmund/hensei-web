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
}

const JobSkillItem = (props: Props) => {
  const router = useRouter()
  const { t } = useTranslation("common")
  const locale =
    router.locale && ["en", "ja"].includes(router.locale) ? router.locale : "en"

  const classes = classNames({
    JobSkill: true,
    editable: props.editable,
  })

  return (
    <div className={classes}>
      {props.skill ? (
        <img
          alt={props.skill.name[locale]}
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}job-skills/${props.skill.slug}.png`}
        />
      ) : (
        <div className="placeholder">
          <PlusIcon />
        </div>
      )}
      <div className="info">
        {/* {props.skill ? <div className="skill pill">Grouping</div> : ""} */}
        {props.skill ? (
          <p>{props.skill.name[locale]}</p>
        ) : (
          <p className="placeholder">Select a skill</p>
        )}
      </div>
    </div>
  )
}

export default JobSkillItem
