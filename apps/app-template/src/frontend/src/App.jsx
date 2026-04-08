import React, { useState, useEffect } from 'react'
import Home from './pages/Home.jsx'
import Denied from './pages/Denied.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const isDenied = window.location.pathname === '/denied'

  useEffect(() => {
    if (isDenied) {
      setLoading(false)
      return
    }

    fetch('/api/me')
      .then(res => {
        if (res.ok) return res.json()
        // Not authenticated — trigger OAuth2 flow
        window.location.href = '/oauth2/authorization/keycloak'
        return null
      })
      .then(data => {
        if (data) {
          setUser(data)
          setLoading(false)
        }
      })
      .catch(() => {
        window.location.href = '/oauth2/authorization/keycloak'
      })
  }, [isDenied])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</p>
      </div>
    )
  }

  if (isDenied) return <Denied />
  return <Home user={user} />
}
