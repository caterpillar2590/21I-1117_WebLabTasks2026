// components/RecipeCard.js
import React from 'react';
import { Link } from 'react-router-dom';

function RecipeCard({ recipe, addToMealPlan, isInMealPlan }) {
  const getDifficultyBadge = (difficulty) => {
    const colors = {
      Easy: 'badge-easy',
      Medium: 'badge-medium',
      Hard: 'badge-hard'
    };
    return colors[difficulty] || 'badge-medium';
  };

  return (
    <div className="recipe-card">
      <Link to={`/recipes/${recipe.id}`} className="card-link">
        <div className="card-image">
          <img src={recipe.image} alt={recipe.name} />
          <span className={`difficulty-badge ${getDifficultyBadge(recipe.difficulty)}`}>
            {recipe.difficulty}
          </span>
          {recipe.vegetarian && <span className="veg-badge">🌱 Vegetarian</span>}
        </div>
        <div className="card-content">
          <h3>{recipe.name}</h3>
          <p className="cuisine">{recipe.cuisine}</p>
          <div className="card-meta">
            <span className="rating">⭐ {recipe.rating}</span>
            <span className="prep-time">⏱️ {recipe.prepTime} min</span>
          </div>
          <p className="description">{recipe.description.substring(0, 80)}...</p>
        </div>
      </Link>
      <button 
        className={`meal-plan-btn ${isInMealPlan ? 'in-plan' : ''}`}
        onClick={() => addToMealPlan(recipe)}
        disabled={isInMealPlan}
      >
        {isInMealPlan ? '✓ In Meal Plan' : '+ Add to Meal Plan'}
      </button>
    </div>
  );
}

export default RecipeCard;
