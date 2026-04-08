import React, { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me')
      .then(res => {
        if (res.ok) return res.json()
        // Not authenticated — Spring Security will redirect to Keycloak
        window.location.href = '/oauth2/authorization/keycloak'
        return null
      })
      .then(data => {
        if (data) {
          // /api/me 응답에 roles, allowedMenus 포함됨
          setUser(data)
          setLoading(false)
        }
      })
      .catch(() => {
        window.location.href = '/oauth2/authorization/keycloak'
      })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</p>
      </div>
    )
  }

  return <Dashboard user={user} />
}
