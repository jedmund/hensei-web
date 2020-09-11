import React, {useState, useEffect} from 'react'
import './App.css'

import Header from './Header/Header'

function App() {
    const [parties, setParties] = useState(false)
    
    useEffect(() => {
        getParty()
    }, [])

    function getParty() {
        fetch('http://localhost:3001')
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

            {parties ? parties : 'There are no parties available'}
            <br />
            <button onClick={createParty}>New party</button>
            <br />
            <button onClick={deleteParty}>Delete party</button>
        </div>
    )
}

export default App
