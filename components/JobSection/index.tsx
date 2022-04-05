import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'

import JobDropdown from '~components/JobDropdown'

import { appState } from '~utils/appState'

import './index.scss'

// Props
interface Props {
    currentJob?: string
}

const JobSection = (props: Props) => {
    const [job, setJob] = useState<Job>()
    const [imageUrl, setImageUrl] = useState('')

    const { party } = useSnapshot(appState)

    useEffect(() => {
        // Set current job based on ID
        setJob(party.job)
    }, [])

    useEffect(() => {
        generateImageUrl()
    })

    useEffect(() => {
        if (job)
            appState.party.job = job
    }, [job])

    function receiveJob(job?: Job) {
        setJob(job)
    }

    function generateImageUrl() {
        let imgSrc = ""
        
        if (job) {
            const slug = job?.name.en.replaceAll(' ', '-').toLowerCase()
            const gender = (true) ? 'a' : 'b'

            imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/jobs/${slug}_${gender}.png`
        }

        setImageUrl(imgSrc)
    }

    // Render: JSX components
    return (
        <section id="Job">
            <div className="JobImage">
                <img src={imageUrl} />
                <div className="Overlay" />
            </div>
            <JobDropdown 
                currentJob={party.job.id}
                onChange={receiveJob} 
            />
        </section>
    )
}

export default JobSection