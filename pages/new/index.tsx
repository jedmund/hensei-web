import React from 'react'
import Party from '~components/Party'

const NewRoute: React.FC = () => {
    function callback(path: string) {
        // This is scuffed, how do we do this natively?
        window.history.replaceState(null, `Grid Tool`, `${path}`)
    }

    return (
        <div id="Content">
            <Party pushHistory={callback} />
        </div>
    )
}

export default NewRoute