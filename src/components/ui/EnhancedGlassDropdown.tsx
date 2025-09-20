'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, 
  Search, 
  Check, 
  X,
  Star,
  AlertCircle
} from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  badge?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

interface EnhancedGlassDropdownProps {
  // Basic props
  label?: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options?: DropdownOption[];
  groups?: DropdownGroup[];
  
  // Behavior
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  modal?: boolean;
  
  // Styling
  placeholder?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'bordered';
  className?: string;
  
  // Advanced features
  maxHeight?: number;
  maxSelections?: number;
  showSelectAll?: boolean;
  customRenderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  customRenderValue?: (values: DropdownOption[]) => React.ReactNode;
  
  // Callbacks
  onSearch?: (query: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function EnhancedGlassDropdown({
  label,
  value,
  onChange,
  options = [],
  groups = [],
  multiple = false,
  searchable = false,
  clearable = false,
  disabled = false,
  loading = false,
  modal = false,
  placeholder = 'Select option...',
  error,
  helperText,
  size = 'md',
  variant = 'default',
  className = '',
  maxHeight = 300,
  maxSelections,
  showSelectAll = false,
  customRenderOption,
  customRenderValue,
  onSearch,
  onOpen,
  onClose
}: EnhancedGlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Combine options from both props
  const allOptions = [...options, ...groups.flatMap(group => group.options)];
  
  // Filter options based on search
  const filteredOptions = searchQuery
    ? allOptions.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allOptions;

  // Handle values
  const selectedValues = Array.isArray(value) ? value : [value];
  const selectedOptions = allOptions.filter(option => selectedValues.includes(option.value));

  // Size variants
  const sizeStyles = {
    sm: {
      button: 'px-3 py-2 text-sm',
      option: 'px-3 py-2 text-sm',
      icon: 16
    },
    md: {
      button: 'px-4 py-3 text-base',
      option: 'px-4 py-3 text-base',
      icon: 20
    },
    lg: {
      button: 'px-5 py-4 text-lg',
      option: 'px-5 py-4 text-lg',
      icon: 24
    }
  };

  // Variant styles
  const variantStyles = {
    default: {
      button: 'bg-white/10 backdrop-blur-md border border-white/20',
      dropdown: 'backdrop-blur-xl border border-white/20'
    },
    minimal: {
      button: 'bg-white/5 backdrop-blur-sm border border-white/10',
      dropdown: 'backdrop-blur-xl border border-white/15'
    },
    bordered: {
      button: 'bg-white/15 backdrop-blur-lg border-2 border-white/30',
      dropdown: 'backdrop-blur-xl border-2 border-white/25'
    }
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  // Mount effect for client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update dropdown position when opened and on scroll
  const updatePosition = () => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    updatePosition();
  }, [isOpen]);

  // Update position on scroll and resize
  useEffect(() => {
    if (isOpen) {
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0) {
            handleOptionClick(filteredOptions[focusedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          onClose?.();
          break;
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedIndex, filteredOptions]);

  const handleToggle = () => {
    if (disabled) return;
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      onOpen?.();
      setFocusedIndex(-1);
    } else {
      onClose?.();
      setSearchQuery('');
    }
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return;

    if (multiple) {
      const newValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : maxSelections && selectedValues.length >= maxSelections
        ? selectedValues
        : [...selectedValues, option.value];
      
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleSelectAll = () => {
    if (!multiple) return;
    
    const allValues = filteredOptions
      .filter(option => !option.disabled)
      .map(option => option.value);
    
    const shouldSelectAll = allValues.some(val => !selectedValues.includes(val));
    
    if (shouldSelectAll) {
      const newValues = maxSelections 
        ? allValues.slice(0, maxSelections)
        : allValues;
      onChange(newValues);
    } else {
      onChange([]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFocusedIndex(-1);
    onSearch?.(query);
  };

  const getOptionColor = (option: DropdownOption) => {
    const colors = {
      default: 'text-white/80',
      primary: 'text-blue-400',
      success: 'text-green-400',
      warning: 'text-yellow-400',
      danger: 'text-red-400'
    };
    return colors[option.color || 'default'];
  };

  const renderDisplayValue = () => {
    if (customRenderValue && selectedOptions.length > 0) {
      return customRenderValue(selectedOptions);
    }

    if (selectedOptions.length === 0) {
      return <span className="text-white/60">{placeholder}</span>;
    }

    if (multiple) {
      if (selectedOptions.length === 1) {
        return <span className="text-white">{selectedOptions[0].label}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.slice(0, 3).map((option, index) => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 bg-white/20 rounded text-xs text-white"
            >
              {option.label}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(option);
                }}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 cursor-pointer inline-flex items-center"
              >
                <X size={12} />
              </span>
            </span>
          ))}
          {selectedOptions.length > 3 && (
            <span className="text-white/60 text-xs">
              +{selectedOptions.length - 3} more
            </span>
          )}
        </div>
      );
    }

    return <span className="text-white">{selectedOptions[0].label}</span>;
  };

  const renderOption = (option: DropdownOption, index: number) => {
    const isSelected = selectedValues.includes(option.value);
    const isFocused = index === focusedIndex;

    if (customRenderOption) {
      return customRenderOption(option, isSelected);
    }

    const IconComponent = option.icon;

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => handleOptionClick(option)}
        disabled={option.disabled}
        className={`
          w-full ${currentSize.option} text-left transition-all duration-200
          flex items-center justify-between group
          ${isFocused ? 'bg-white/20' : 'hover:bg-white/15'}
          ${isSelected ? 'bg-white/20' : ''}
          ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          first:rounded-t-lg last:rounded-b-lg
        `}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {IconComponent && (
            <IconComponent 
              size={currentSize.icon} 
              className={`flex-shrink-0 ${getOptionColor(option)}`} 
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${getOptionColor(option)} truncate`}>
              {option.label}
            </div>
            {option.description && (
              <div className="text-xs text-white/50 truncate">
                {option.description}
              </div>
            )}
          </div>

          {option.badge && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex-shrink-0">
              {option.badge}
            </span>
          )}
        </div>

        {multiple && isSelected && (
          <Check size={currentSize.icon} className="text-green-400 flex-shrink-0 ml-2" />
        )}
      </button>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            w-full ${currentSize.button} text-left rounded-lg
            ${currentVariant.button}
            focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20
            transition-all duration-200
            flex items-center justify-between
            ${error ? 'border-red-400/50 focus:border-red-400/70' : ''}
            ${isOpen ? 'border-white/40 ring-2 ring-white/20' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex-1 min-w-0 mr-2">
            {renderDisplayValue()}
          </div>
          
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            )}
            
            {clearable && selectedOptions.length > 0 && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={16} className="text-white/60" />
              </button>
            )}
            
            <ChevronDown 
              size={currentSize.icon}
              className={`text-white/60 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Modal/Dropdown Portal */}
        {mounted && isOpen && createPortal(
          modal ? (
            // Modal Version
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
              />
              
              {/* Modal Content */}
              <div 
                ref={dropdownRef}
                className={`
                  relative w-full max-w-md ${currentVariant.dropdown} rounded-lg shadow-2xl
                  animate-fadeInUp
                `}
                style={{ 
                  maxHeight: '80vh',
                  backgroundColor: 'rgba(17, 24, 39, 0.9)'
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h3 className="text-lg font-medium text-white">
                    {label || 'Select Options'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onClose?.();
                    }}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} className="text-white/60" />
                  </button>
                </div>
                
                {/* Content */}
              {/* Search */}
              {searchable && (
                <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search 
                    size={16} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" 
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search options..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Select All */}
            {multiple && showSelectAll && filteredOptions.length > 0 && (
              <div className="p-2 border-b border-white/10">
                <button
                  onClick={handleSelectAll}
                  className="w-full px-3 py-2 text-left hover:bg-white/10 rounded text-blue-400 font-medium transition-colors"
                >
                  {filteredOptions.every(opt => selectedValues.includes(opt.value) || opt.disabled)
                    ? 'Deselect All'
                    : 'Select All'
                  }
                </button>
              </div>
            )}

            {/* Options */}
            <div 
              ref={optionsRef}
              className="overflow-y-auto overflow-x-hidden"
              style={{ 
                maxHeight: maxHeight - (searchable ? 60 : 0) - (showSelectAll ? 40 : 0),
                minHeight: '2rem'
              }}
            >
              {groups.length > 0 ? (
                // Grouped options
                groups.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <div className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wide border-b border-white/5">
                      {group.label}
                    </div>
                    {group.options
                      .filter(option => 
                        !searchQuery || 
                        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((option, optionIndex) => {
                        const globalIndex = allOptions.findIndex(opt => opt.value === option.value);
                        return renderOption(option, globalIndex);
                      })
                    }
                  </div>
                ))
              ) : (
                // Regular options
                filteredOptions.map((option, index) => renderOption(option, index))
              )}

              {filteredOptions.length === 0 && (
                <div className="px-4 py-6 text-center text-white/50">
                  <AlertCircle size={24} className="mx-auto mb-2" />
                  <div className="text-sm">
                    {searchQuery ? 'No matching options found' : 'No options available'}
                  </div>
                </div>
              )}
            </div>
            
                
                {/* Modal footer with actions */}
                <div className="flex justify-end gap-3 p-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onClose?.();
                    }}
                    className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  {multiple && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onClose?.();
                      }}
                      className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Done ({selectedOptions.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Dropdown Version
            <div 
              ref={dropdownRef}
              className={`
                fixed z-[99999] ${currentVariant.dropdown} rounded-lg shadow-2xl
                animate-fadeInUp
              `}
              style={{ 
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight,
                backgroundColor: 'rgba(17, 24, 39, 0.9)'
              }}
            >
              {/* Search */}
              {searchable && (
                <div className="p-3 border-b border-white/10">
                  <div className="relative">
                    <Search 
                      size={16} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" 
                    />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search options..."
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Select All */}
              {multiple && showSelectAll && filteredOptions.length > 0 && (
                <div className="p-2 border-b border-white/10">
                  <button
                    onClick={handleSelectAll}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 rounded text-blue-400 font-medium transition-colors"
                  >
                    {filteredOptions.every(opt => selectedValues.includes(opt.value) || opt.disabled)
                      ? 'Deselect All'
                      : 'Select All'
                    }
                  </button>
                </div>
              )}

              {/* Options */}
              <div 
                ref={optionsRef}
                className="overflow-y-auto overflow-x-hidden"
                style={{ 
                  maxHeight: maxHeight - (searchable ? 60 : 0) - (showSelectAll ? 40 : 0),
                  minHeight: '2rem'
                }}
              >
                {groups.length > 0 ? (
                  // Grouped options
                  groups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <div className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wide border-b border-white/5">
                        {group.label}
                      </div>
                      {group.options
                        .filter(option => 
                          !searchQuery || 
                          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          option.description?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((option, optionIndex) => {
                          const globalIndex = allOptions.findIndex(opt => opt.value === option.value);
                          return renderOption(option, globalIndex);
                        })
                      }
                    </div>
                  ))
                ) : (
                  // Regular options
                  filteredOptions.map((option, index) => renderOption(option, index))
                )}

                {filteredOptions.length === 0 && (
                  <div className="px-4 py-6 text-center text-white/50">
                    <AlertCircle size={24} className="mx-auto mb-2" />
                    <div className="text-sm">
                      {searchQuery ? 'No matching options found' : 'No options available'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ),
          document.body
        )}
      </div>

      {/* Helper text */}
      {(error || helperText) && (
        <div className="mt-2 flex items-start space-x-1">
          {error && <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
          <p className={`text-xs ${error ? 'text-red-400' : 'text-white/50'}`}>
            {error || helperText}
          </p>
        </div>
      )}

      {/* Selection count for multiple */}
      {multiple && selectedOptions.length > 0 && maxSelections && (
        <div className="mt-1 text-xs text-white/50">
          {selectedOptions.length} of {maxSelections} selected
        </div>
      )}
    </div>
  );
}