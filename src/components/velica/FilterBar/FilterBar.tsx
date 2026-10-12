import React, { useState, useEffect } from 'react';
import { Input, Button } from 'antd';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  placeholder?: string;
  onSearchChange: (value: string) => void;
  children?: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  placeholder = 'Tìm kiếm...',
  onSearchChange,
  children,
  onClearFilters,
  hasActiveFilters = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleClear = () => {
    setSearchTerm('');
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <div className="velica-filterbar-container">
      <div className="velica-filterbar-left">
        <div className="velica-filterbar-search-wrap">
          <Input
            placeholder={placeholder}
            prefix={<Search size={16} className="text-brand-color" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className="velica-filterbar-input"
          />
        </div>
        {children}
      </div>

      {(hasActiveFilters || searchTerm) && (
        <Button
          type="text"
          onClick={handleClear}
          icon={<X size={14} />}
          className="velica-filterbar-clear-btn"
        >
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
};
