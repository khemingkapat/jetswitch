import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [mlMessage, setMlMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [mlLoading, setMlLoading] = useState(true)
  const [error, setError] = useState('')
  const [mlError, setMlError] = useState('')

  useEffect(() => {
    // Fetch message from Go backend
    fetch('http://localhost:8080')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then(data => {
        setMessage(data.message)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })

    // Fetch ML message from Go backend /ml endpoint
    fetch('http://localhost:8080/ml')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then(data => {
        setMlMessage(data.message)
        setMlLoading(false)
      })
      .catch(err => {
        setMlError(err.message)
        setMlLoading(false)
      })
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      {/* Display the message from backend */}
      <div className="card">
        <h3>Go Backend Message:</h3>
        {loading ? (
          <p>Loading message...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{message}</p>
        )}
      </div>

      {/* Display the ML service message */}
      <div className="card">
        <h3>ML Service Message:</h3>
        {mlLoading ? (
          <p>Loading ML message...</p>
        ) : mlError ? (
          <p style={{ color: 'red' }}>Error: {mlError}</p>
        ) : (
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#61dafb' }}>{mlMessage}</p>
        )}
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
