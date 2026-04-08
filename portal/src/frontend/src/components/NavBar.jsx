import React, { useState } from 'react'

const MENU_LABELS = {
  data: 'Data',
  myservice: 'MyService',
  datacatalog: 'DataCatalog',
  admin: 'Admin',
}

export default function NavBar({ allowedMenus = [] }) {
  const [active, setActive] = useState(null)

  if (allowedMenus.length === 0) return null

  return (
    <nav style={{
      backgroundColor: '#16213e',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      gap: '0.25rem',
      padding: '0 2rem',
    }}>
      {allowedMenus.map(menuId => (
        <button
          key={menuId}
          onClick={() => setActive(menuId)}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: active === menuId ? '2px solid #60a5fa' : '2px solid transparent',
            color: active === menuId ? '#60a5fa' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: active === menuId ? 600 : 400,
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          {MENU_LABELS[menuId] || menuId}
        </button>
      ))}
    </nav>
  )
}
