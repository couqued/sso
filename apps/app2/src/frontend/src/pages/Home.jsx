import React, { useState } from 'react'

const MENU_LABELS = {
  data: 'Data',
  myservice: 'MyService',
  datacatalog: 'DataCatalog',
  admin: 'Admin',
}

export default function Home({ user, allowedMenus = [] }) {
  const [activeMenu, setActiveMenu] = useState(null)
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
        </div>

        {/* 포탈에서 전달받은 메뉴 권한 기반 네비게이션 */}
        {allowedMenus.length > 0 && (
          <nav style={{
            backgroundColor: '#172033',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            gap: '0.25rem',
            padding: '0 2rem',
          }}>
            {allowedMenus.map(menuId => (
              <button
                key={menuId}
                onClick={() => setActiveMenu(menuId)}
                style={{
                  padding: '10px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeMenu === menuId ? '2px solid #60a5fa' : '2px solid transparent',
                  color: activeMenu === menuId ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: activeMenu === menuId ? 600 : 400,
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {MENU_LABELS[menuId] || menuId}
              </button>
            ))}
          </nav>
        )}
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
          {activeMenu && (
            <p style={{ marginTop: '1rem', color: '#3b82f6', fontSize: '0.9rem' }}>
              현재 메뉴: <strong>{MENU_LABELS[activeMenu] || activeMenu}</strong>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
