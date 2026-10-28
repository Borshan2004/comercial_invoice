'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

export interface SuggestionItem {
  id?: string;
  value: string;
}

interface SuggestionInputProps {
  value: string;
  onChange: (val: string) => void;
  suggestions?: SuggestionItem[] | string[];
  field: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'textarea';
  rows?: number;
  className?: string;
  inputClassName?: string;
  isAdmin?: boolean;
  onDeleteSuggestion?: (item: { id?: string; value: string; field: string }) => Promise<void> | void;
  onSaveSuggestion?: (field: string, value: string) => void;
  onSelectSuggestion?: (itemValue: string, item?: SuggestionItem) => void;
  disabled?: boolean;
  showDropdownArrow?: boolean;
}

export default function SuggestionInput({
  value,
  onChange,
  suggestions = [],
  field,
  placeholder,
  required = false,
  type = 'text',
  rows = 2,
  className = '',
  inputClassName = '',
  isAdmin = false,
  onDeleteSuggestion,
  onSaveSuggestion,
  onSelectSuggestion,
  disabled = false,
  showDropdownArrow = true,
}: SuggestionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync internal query with external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize suggestions to { id, value }
  const normalizedList: SuggestionItem[] = suggestions.map((s, idx) => {
    if (typeof s === 'string') {
      return { id: `item-${idx}`, value: s };
    }
    return s;
  });

  // Filter based on input query
  const filtered = !query.trim()
    ? normalizedList
    : normalizedList.filter((item) =>
        item.value.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (itemValue: string, item?: SuggestionItem) => {
    setQuery(itemValue);
    onChange(itemValue);
    if (onSelectSuggestion) {
      onSelectSuggestion(itemValue, item);
    }
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
  };

  // When user leaves the field, if there's a new value, automatically save it as a suggestion!
  const handleBlur = () => {
    const trimmed = query.trim();
    if (trimmed.length > 0 && onSaveSuggestion) {
      const alreadyExists = normalizedList.some(
        (s) => s.value.toLowerCase() === trimmed.toLowerCase()
      );
      if (!alreadyExists) {
        onSaveSuggestion(field, trimmed);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: SuggestionItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteSuggestion) {
      await onDeleteSuggestion({ id: item.id, value: item.value, field });
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={query}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 resize-none ${inputClassName}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={query}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 ${
              showDropdownArrow && normalizedList.length > 0 ? 'pr-7' : ''
            } ${inputClassName}`}
          />
        )}

        {showDropdownArrow && normalizedList.length > 0 && type !== 'textarea' && (
          <button
            type="button"
            disabled={disabled}
            tabIndex={-1}
            onMouseDown={toggleDropdown}
            className="absolute right-0 top-0 bottom-0 px-2 flex items-center text-slate-400 hover:text-slate-700 transition"
            title="Show saved suggestions"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && !disabled && filtered.length > 0 && (
        <div className="absolute z-[100] left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-300 rounded-md shadow-xl py-1 text-xs sm:text-sm animate-in fade-in-50 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100 flex justify-between items-center select-none">
            <span>Suggestions ({filtered.length})</span>
            {isAdmin && (
              <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                Admin (x to delete)
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-50">
            {filtered.map((item, idx) => {
              const isSelected = query.toLowerCase() === item.value.toLowerCase();
              return (
                <div
                  key={item.id || idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item.value, item);
                  }}
                  className={`px-3 py-1.5 cursor-pointer flex items-center justify-between group transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center min-w-0 pr-2">
                    <span className="truncate">{item.value}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 ml-1.5 flex-shrink-0" />
                    )}
                  </div>

                  {/* 'X' button for deleting suggestion - ONLY VISIBLE TO ADMIN */}
                  {isAdmin && (
                    <button
                      type="button"
                      onMouseDown={(e) => handleDelete(e, item)}
                      title="Delete this suggestion (Admin only)"
                      className="flex-shrink-0 ml-2 p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
