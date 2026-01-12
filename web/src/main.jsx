import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <ThemeProvider>
        <SettingsProvider>
            <LanguageProvider>
                <App />
            </LanguageProvider>
        </SettingsProvider>
    </ThemeProvider>
)