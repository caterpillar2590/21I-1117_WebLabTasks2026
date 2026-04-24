// components/SearchBar.js
import React from 'react';

function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="🔍 Search by name or cuisine..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button onClick={() => setSearchTerm('')} className="clear-search">
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;
