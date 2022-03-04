import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import Party from '~components/Party'

const PartyRoute: React.FC = () => {
    const { party: slug } = useRouter().query

    return (
        <div id="Content">
            <Head>
                <title>Party</title>
            </Head>
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

export default PartyRoute