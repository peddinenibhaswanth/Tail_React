import React from "react";
import { Container, Alert, Button } from "react-bootstrap";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Alert variant="danger" className="text-center">
            <Alert.Heading className="mb-3">
              <i className="bi bi-exclamation-triangle-fill fs-1 d-block mb-3"></i>
              Oops! Something went wrong
            </Alert.Heading>
            <p className="mb-4">
              We're sorry, but something unexpected happened. Our team has been
              notified and we're working to fix the issue.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-start mb-4">
                <summary className="btn btn-sm btn-outline-danger mb-2">
                  View Error Details
                </summary>
                <pre className="bg-light p-3 rounded mt-2 small text-dark">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="d-flex gap-2 justify-content-center">
              <Button
                variant="primary"
                onClick={this.handleReset}
                aria-label="Go to home page"
              >
                Go to Home Page
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => window.location.reload()}
                aria-label="Reload page"
              >
                Reload Page
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
