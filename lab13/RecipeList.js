// components/RecipeList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RecipeCard from './RecipeCard';
import SearchBar from './SearchBar';
import CuisineFilter from './CuisineFilter';
import DifficultyFilter from './DifficultyFilter';
import { recipesData } from '../data/recipes';

function RecipeList({ addToMealPlan, mealPlan }) {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setRecipes(recipesData);
      setFilteredRecipes(recipesData);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let results = [...recipes];
    
    // Search filter
    if (searchTerm) {
      results = results.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Cuisine filter
    if (selectedCuisine) {
      results = results.filter(recipe => recipe.cuisine === selectedCuisine);
    }
    
    // Difficulty filter
    if (selectedDifficulty) {
      results = results.filter(recipe => recipe.difficulty === selectedDifficulty);
    }
    
    // Sorting
    results.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'prepTime') return a.prepTime - b.prepTime;
      return a.name.localeCompare(b.name);
    });
    
    setFilteredRecipes(results);
  }, [searchTerm, selectedCuisine, selectedDifficulty, sortBy, recipes]);

  const getUniqueCuisines = () => {
    return [...new Set(recipes.map(recipe => recipe.cuisine))];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="recipe-list-page">
      <h1>All Recipes</h1>
      
      <div className="filters-section">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        <div className="filter-group">
          <CuisineFilter 
            cuisines={getUniqueCuisines()} 
            selectedCuisine={selectedCuisine} 
            setSelectedCuisine={setSelectedCuisine} 
          />
          <DifficultyFilter 
            selectedDifficulty={selectedDifficulty} 
            setSelectedDifficulty={setSelectedDifficulty} 
          />
          
          <div className="sort-control">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="prepTime">Prep Time</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="results-count">
        Found {filteredRecipes.length} recipes
      </div>
      
      <div className="recipes-grid">
        {filteredRecipes.map(recipe => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            addToMealPlan={addToMealPlan}
            isInMealPlan={mealPlan.some(r => r.id === recipe.id)}
          />
        ))}
      </div>
      
      {filteredRecipes.length === 0 && (
        <div className="no-results">
          <p>No recipes found. Try adjusting your filters!</p>
        </div>
      )}
    </div>
  );
}

export default RecipeList;
