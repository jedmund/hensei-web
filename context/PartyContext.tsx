import { createContext } from 'react'
import { TeamElement } from '~utils/enums'

const PartyContext = createContext({
    id: '',
    setId: (id: string) => {},
    element: TeamElement.Any,
    setElement: (element: TeamElement) => {},
    editable: false,
    setEditable: (editable: boolean) => {},
    hasExtra: false,
    setHasExtra: (hasExtra: boolean) => {}
})

export default PartyContext