import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    // Alert Threshold (PM2.5), default 75
    const [alertThreshold, setAlertThreshold] = useState(() => {
        const saved = localStorage.getItem('alertThreshold');
        const parsed = parseInt(saved, 10);
        return !isNaN(parsed) ? parsed : 75;
    });

    // Refresh Interval (ms), default 60000 (1 min)
    const [refreshInterval, setRefreshInterval] = useState(() => {
        const saved = localStorage.getItem('refreshInterval');
        const parsed = parseInt(saved, 10);
        return !isNaN(parsed) ? parsed : 60000;
    });

    useEffect(() => {
        localStorage.setItem('alertThreshold', alertThreshold);
    }, [alertThreshold]);

    useEffect(() => {
        localStorage.setItem('refreshInterval', refreshInterval);
    }, [refreshInterval]);

    return (
        <SettingsContext.Provider value={{
            alertThreshold,
            setAlertThreshold,
            refreshInterval,
            setRefreshInterval
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
