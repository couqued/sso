import React from 'react'

export default function Denied() {
  const params = new URLSearchParams(window.location.search)
  const fromPortal = params.get('from') === 'portal'
  const reason = params.get('reason')

  const goToPortal = () => {
    window.location.href = 'http://portal.sso.local'
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1rem', color: '#dc2626' }}>
          Access Denied
        </h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
          {fromPortal
            ? "You don't have a subscription for this application. Please contact your administrator to request access."
            : reason === 'no_sso_session'
              ? "You need to log in through the SSO Portal to access this application."
              : "You are not authorized to access this application."
          }
        </p>
        <button
          onClick={goToPortal}
          style={{
            padding: '12px 32px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem'
          }}
        >
          Go to Portal
        </button>
      </div>
    </div>
  )
}
