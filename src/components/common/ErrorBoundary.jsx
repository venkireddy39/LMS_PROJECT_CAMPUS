import React from 'react';

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
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-center p-4">
                    <div className="card shadow-sm border-0 p-5 glass-card" style={{ maxWidth: '600px' }}>
                        <h1 className="text-danger mb-4">Something went wrong</h1>
                        <p className="lead mb-4">
                            We're sorry, but an unexpected error occurred.
                        </p>
                        {this.state.error && (
                            <details className="text-start bg-white p-3 rounded border mb-4 w-100" style={{ maxHeight: '200px', overflow: 'auto' }}>
                                <summary className="cursor-pointer mb-2">Error Details</summary>
                                <code className="text-danger small">
                                    {this.state.error.toString()}
                                </code>
                            </details>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
