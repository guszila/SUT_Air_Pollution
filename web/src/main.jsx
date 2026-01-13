import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
    <ThemeProvider>
        <SettingsProvider>
            <LanguageProvider>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </LanguageProvider>
        </SettingsProvider>
    </ThemeProvider>
)