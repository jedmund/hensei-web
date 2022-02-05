import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Party from '~components/Party'
import * as AlertDialog  from '@radix-ui/react-alert-dialog'

const PartyRoute: React.FC = () => {
    const router = useRouter()
    const { party: slug } = router.query

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

export default PartyRoute