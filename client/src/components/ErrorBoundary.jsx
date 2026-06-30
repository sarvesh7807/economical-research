import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('CRASH DETAILS:', error.message)
    console.error('STACK:', error.stack)
    console.error('COMPONENT:', info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded m-2 text-sm text-center">
          This section is temporarily unavailable. Rest of site works fine.
        </div>
      );
    }
    return this.props.children
  }
}

export default ErrorBoundary;
