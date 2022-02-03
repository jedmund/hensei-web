import { createContext } from 'react'
import { TeamElement } from '~utils/enums'

const PartyContext = createContext({
    element: TeamElement.Any,
    setElement: (element: TeamElement) => {}
})

export default PartyContext