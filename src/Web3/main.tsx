import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx'
import '../index.css'
// import { Web3Provider } from './web3/providers.tsx'  // Commented out - file doesn't exist

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)