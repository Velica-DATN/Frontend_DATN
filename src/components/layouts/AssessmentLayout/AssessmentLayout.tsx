import React from 'react';
import { Outlet } from 'react-router-dom';

export const AssessmentLayout: React.FC = () => {
  return (
    <div className="velica-assessment-layout-root d-flex flex-column">
      <Outlet />
    </div>
  );
};
