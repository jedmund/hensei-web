import React from 'react'
import Party from '~components/Party'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

const NewRoute = () => {
    function callback(path: string) {
        // This is scuffed, how do we do this natively?
        window.history.replaceState(null, `Grid Tool`, `${path}`)
    }

    return (
        <div id="Content">
            <Party new={true} pushHistory={callback} />
        </div>
    )
}

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
            // Will be passed to the page component as props
        },
    }
}

export default NewRoute