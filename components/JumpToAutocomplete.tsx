'use client'
import { useState, useRef } from 'react';

interface JumpToAutocompleteProps {
  items: Array<{ label: string; anchor: string }>;
  placeholder?: string;
  className?: string;
}

export default function JumpToAutocomplete({ items, placeholder = 'Jump to…', className = '' }: JumpToAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  function handleSelect(anchor: string) {
    setShowDropdown(false);
    setQuery('');
    // Scroll to the anchor
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Optionally blur input
    inputRef.current?.blur();
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg placeholder-gray-500"
        placeholder={placeholder}
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
        autoComplete="off"
      />
      {showDropdown && filtered.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          {filtered.map(item => (
            <li
              key={item.anchor}
              className="px-4 py-2 cursor-pointer hover:bg-primary-100 text-primary"
              onMouseDown={() => handleSelect(item.anchor)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 