import React from 'react'

export default function Home({ user }) {
  const appName = user?.appName || 'App'

  const handleLogout = () => {
    window.location.href = '/logout'
  }

  const goToPortal = () => {
    window.location.href = 'http://portal.sso.local'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{appName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            {user?.username}
          </span>
          <button
            onClick={goToPortal}
            style={{
              padding: '6px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Portal
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: '800px',
        margin: '4rem auto',
        padding: '0 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '3rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Welcome to {appName}
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            You are logged in as <strong>{user?.username}</strong> via SSO.
          </p>
        </div>
      </main>
    </div>
  )
}
