import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { DesktopCanvas } from '../desktop/canvas/DesktopCanvas';

export const ShellRoot: React.FC = () => {
  return (
    <ErrorBoundary>
      <DesktopCanvas />
    </ErrorBoundary>
  );
};
