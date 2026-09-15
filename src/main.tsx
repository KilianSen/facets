import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Root } from './app/Root'
import { ErrorBoundary } from './ui/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
)
