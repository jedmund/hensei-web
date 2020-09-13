import React, {useState, useEffect} from 'react'
import './App.css'

import Header from './components/Header/Header'
import Main from './Main/Main'

function App() {
    const [parties, setParties] = useState(false)
    
    useEffect(() => {
        getParty()
    }, [])

    function getParty() {
        fetch('http://localhost:3001/parties')
            .then(response => {
                return response.text()
            })
            .then(data => {
                setParties((data != null) ? true : false)
            })
    }

    function createParty() {
        fetch('http://localhost:3001/parties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
            // body: JSON.stringify({stuff})
        })
            .then(response => {
                return response.text()
            })
            .then(data => {
                alert(data)
                getParty()
            })
    }

    function deleteParty() {
        let hash = prompt('Enter hash')
        fetch(`http://localhost:3001/parties/${hash}`, {
            method: 'DELETE'
        })
            .then(response => {
                return response.text()
            })
            .then(data => {
                alert(data)
                getParty()
            })
    }

    return (
        <div>
            <Header />
            <Main />
        </div>
    )
}

export default App
