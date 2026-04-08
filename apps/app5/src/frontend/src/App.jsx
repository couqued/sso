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

    // 포탈에서 전달한 메뉴 권한 파라미터를 sessionStorage에 저장
    const params = new URLSearchParams(window.location.search)
    const portalPerms = params.get('portal_perms')
    if (portalPerms) {
      sessionStorage.setItem('allowedMenus', portalPerms)
      // URL에서 파라미터 제거 (히스토리에 남지 않도록)
      window.history.replaceState({}, '', window.location.pathname)
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

  const allowedMenus = (sessionStorage.getItem('allowedMenus') || '').split(',').filter(Boolean)
  return <Home user={user} allowedMenus={allowedMenus} />
}
