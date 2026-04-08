import React from 'react'

const ICONS = {
  'chart-bar': '📊',
  'folder': '📁',
  'users': '👥',
  'currency-dollar': '💰',
  'ticket': '🎫',
}

export default function AppCard({ app }) {
  const icon = ICONS[app.icon] || '🔲'

  const handleClick = () => {
    window.location.href = `/api/redirect/${app.id}`
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: app.subscribed ? '1px solid #e2e8f0' : '1px solid #f1f5f9',
      opacity: app.subscribed ? 1 : 0.75,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
        {app.name}
      </h3>

      {app.subscribed ? (
        <button
          onClick={handleClick}
          style={{
            marginTop: 'auto',
            padding: '8px 0',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          Open App
        </button>
      ) : (
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            color: '#94a3b8',
          }}>
            🔒 No subscription
          </span>
          <button
            onClick={handleClick}
            style={{
              padding: '8px 0',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Request Access
          </button>
        </div>
      )}
    </div>
  )
}
