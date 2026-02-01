/**
 * Ketchup Portal - Entry Point
 * 
 * Main entry file for Ketchup operations portal
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@smartpay/ui/styles';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
