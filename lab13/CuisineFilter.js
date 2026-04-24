// components/CuisineFilter.js
import React from 'react';

function CuisineFilter({ cuisines, selectedCuisine, setSelectedCuisine }) {
  return (
    <div className="filter-dropdown">
      <label>Cuisine:</label>
      <select 
        value={selectedCuisine} 
        onChange={(e) => setSelectedCuisine(e.target.value)}
      >
        <option value="">All Cuisines</option>
        {cuisines.map(cuisine => (
          <option key={cuisine} value={cuisine}>{cuisine}</option>
        ))}
      </select>
      {selectedCuisine && (
        <button onClick={() => setSelectedCuisine('')} className="clear-filter">
          ✕
        </button>
      )}
    </div>
  );
}

export default CuisineFilter;
