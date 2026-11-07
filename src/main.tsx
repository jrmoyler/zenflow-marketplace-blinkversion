import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#0F1220',
          color: '#F8FAFC',
          border: '1px solid #1E2235',
          fontFamily: 'var(--font-sans)',
        },
      }}
    />
    <App />
  </React.StrictMode>,
)
