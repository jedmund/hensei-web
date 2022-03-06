import React from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/Party'

const PartyRoute: React.FC = () => {
    const { party: slug } = useRouter().query

    return (
        <div id="Content">
            <Party slug={slug as string} />
        </div>
    )

    // function renderNotFound() {
    //     return (
    //         <div id="NotFound">
    //             <h2>There&apos;s no grid here.</h2>
    //             <Button type="new">New grid</Button>
    //         </div>
    //     )
    // }

    // if (!found && !loading) {
    //     return renderNotFound()
    // } else if (found && !loading) {
    //     return render()
    // } else {
    //     return (<div />)
    // }
}

export async function getStaticPaths() {
    return {
        paths: [
            // Object variant:
            { params: { party: 'string' } },
        ],
        fallback: true,
    }
}

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
            // Will be passed to the page component as props
        },
    }
}

export default PartyRoute