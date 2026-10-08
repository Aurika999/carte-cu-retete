import React, { useRef } from "react";
import { Search, X } from "lucide-react";

// Bara de căutare folosită peste tot: câmp + „×” (șterge) + buton „Caută”.
// Căutarea pornește la Enter sau la apăsarea butonului (onSubmit); onChange se apelează la fiecare
// literă, pentru paginile care filtrează pe loc. După căutare, câmpul își pierde focusul,
// ca pe telefon să se închidă tastatura și să se vadă rezultatele.
export default function SearchBar({
  value, onChange, onSubmit, placeholder, buttonLabel = "Caută", icon: Icon = Search, className = "", autoBlur = true,
}) {
  const inputRef = useRef(null);
  function submit(e) {
    e.preventDefault();
    if (autoBlur) inputRef.current?.blur();
    onSubmit?.(value.trim());
  }
  return (
    <form className={`searchBar ${className}`} onSubmit={submit} role="search">
      <Icon size={18} className="searchBarIcon" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button type="button" className="searchBarClear" onClick={() => { onChange(""); inputRef.current?.focus(); }} aria-label="Șterge textul">
          <X size={16} />
        </button>
      )}
      <button type="submit" className="searchBarBtn" disabled={!value.trim()}>
        <Search size={15} /> <span>{buttonLabel}</span>
      </button>
    </form>
  );
}
