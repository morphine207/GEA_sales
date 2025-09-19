import React, { useState, useEffect, useRef } from 'react';

export interface ImputeTextProps {
  initialValue: string;
  onSave: (value: string) => void;
  highlightText?: boolean;
  className?: string;
  placeholder?: string;
}

export const ImputeText: React.FC<ImputeTextProps> = ({
  initialValue,
  onSave,
  highlightText = false,
  className = '',
  placeholder = 'Click to edit'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(value.length, value.length);
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none"
          placeholder={placeholder}
        />
      ) : (
        <div 
          onClick={handleClick}
          className={`cursor-text px-2 py-1 rounded truncate ${!highlightText ? "hover:bg-gray-100" : "hover:bg-amber-100 bg-amber-200"}`}
          title={value || placeholder}
        >
          {value || <span className="text-gray-400">{placeholder}</span>}
        </div>
      )}
    </div>
  );
};

export default ImputeText; 