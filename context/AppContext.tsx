import { createContext } from 'react'

const AppContext = createContext({
    authenticated: false,
    editable: false,
    setAuthenticated: (auth: boolean) => {},
    setEditable: (editable: boolean) => {}
})

export default AppContext