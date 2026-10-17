import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Collapse } from 'antd';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const { Text, Paragraph } = Typography;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Production logging service could be wired here (e.g. Sentry, Datadog)
    console.error('Velica ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="d-flex items-center justify-center p-4 min-vh-75">
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 max-w-2xl w-100 bg-white">
            <Result
              status="warning"
              icon={<AlertTriangle size={56} className="text-amber-500" />}
              title={<span className="fw-bold fs-4">Đã xảy ra sự cố hiển thị</span>}
              subTitle={
                <span className="text-secondary-color text-sm">
                  Giao diện trang hiện tại gặp sự cố ngoài dự kiến. Các dữ liệu khác của bạn trong hệ thống vẫn an toàn.
                </span>
              }
              extra={[
                <Button
                  key="retry"
                  type="primary"
                  icon={<RefreshCw size={15} />}
                  onClick={this.handleReset}
                  className="velica-btn-primary"
                >
                  Thử lại
                </Button>,
                <Button key="reload" onClick={this.handleReload}>
                  Tải lại trang
                </Button>,
                <Button key="home" icon={<Home size={15} />} onClick={this.handleGoHome}>
                  Về trang chủ
                </Button>,
              ]}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
