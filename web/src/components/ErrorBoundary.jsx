import React from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReload = () => {
        // Attempt to recover by clearing local storage if it's a settings issue
        // But safely, maybe just reload first
        window.location.reload();
    };

    handleResetSettings = () => {
        localStorage.removeItem('alertThreshold');
        localStorage.removeItem('refreshInterval');
        localStorage.removeItem('appLanguage');
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '50px', display: 'flex', justifyContent: 'center', height: '100vh', alignItems: 'center' }}>
                    <Result
                        status="500"
                        title="Something went wrong"
                        subTitle="Sorry, an unexpected error occurred."
                        extra={[
                            <Button type="primary" key="reload" onClick={this.handleReload}>
                                Reload Page
                            </Button>,
                            <Button key="reset" danger onClick={this.handleResetSettings}>
                                Reset Settings
                            </Button>
                        ]}
                    >
                        <div className="desc">
                            <p style={{ paragraph: { marginBottom: '1em' } }}>
                                <span style={{ color: 'red' }}>Error: {this.state.error?.toString()}</span>
                            </p>
                            <details style={{ whiteSpace: 'pre-wrap' }}>
                                {this.state.errorInfo?.componentStack}
                            </details>
                        </div>
                    </Result>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
