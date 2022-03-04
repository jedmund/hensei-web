import React from 'react'
import Head from 'next/head'
import Party from '~components/Party'

const NewRoute = () => {
    function callback(path: string) {
        // This is scuffed, how do we do this natively?
        window.history.replaceState(null, `Grid Tool`, `${path}`)
    }

    return (
        <div id="Content">
            <Head>
                <title>New Team</title>
            </Head>
            <Party new={true} pushHistory={callback} />
        </div>
    )
}

export default NewRoute