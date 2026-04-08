import React, { useState, useEffect } from 'react'
import AppCard from '../components/AppCard.jsx'
import NavBar from '../components/NavBar.jsx'

const ROLE_LABELS = {
  customer: '고객',
  developer: '개발자',
  admin: '관리자',
}

export default function Dashboard({ user }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  const allowedMenus = user?.allowedMenus || []
  const userRoles = user?.roles || []
  const displayRole = userRoles
    .map(r => ROLE_LABELS[r])
    .filter(Boolean)
    .join(', ')

  useEffect(() => {
    fetch('/api/apps')
      .then(res => res.json())
      .then(data => {
        setApps(data)
        setLoading(false)
      })
  }, [])

  const handleLogout = () => {
    window.location.href = '/logout'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1a1a2e',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        {/* 상단 타이틀 바 */}
        <div style={{
          padding: '0 2rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>SSO Portal</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{user?.username}</div>
              {displayRole && (
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{displayRole}</div>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #64748b',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* 역할 기반 네비게이션 메뉴 */}
        <NavBar allowedMenus={allowedMenus} />
      </header>

      {/* Main content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          My Applications
        </h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          Click an app to launch it. Subscribed apps open automatically via SSO.
        </p>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading apps...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            {apps.map(app => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
