import React from 'react'
import Party from '~components/Party'

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

export default NewRoute