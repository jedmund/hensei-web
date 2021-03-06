import React from 'react'
import { RouteComponentProps } from 'react-router-dom'

import Party from '~components/Party'

interface Props extends RouteComponentProps {}

const NewRoute: React.FC<Props> = () => {
    function callback(path: string) {
        // This is scuffed, how do we do this natively?
        window.history.replaceState(null, `Grid Tool`, `${path}`)
    }

    return (
        <div id="Content">
            <Party
                editable={true}
                exists={false}
                pushHistory={callback}
            />
        </div>
    )
}

export default NewRoute