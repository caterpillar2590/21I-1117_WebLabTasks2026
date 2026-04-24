// components/MealPlan.js
import React from 'react';
import { Link } from 'react-router-dom';

function MealPlan({ mealPlan, removeFromMealPlan }) {
  const totalPrepTime = mealPlan.reduce((sum, recipe) => sum + recipe.prepTime, 0);

  return (
    <div className="meal-plan-page">
      <h1>Weekly Meal Plan</h1>
      
      {mealPlan.length === 0 ? (
        <div className="empty-plan">
          <p>Your meal plan is empty.</p>
          <Link to="/recipes" className="browse-btn">Browse Recipes</Link>
        </div>
      ) : (
        <>
          <div className="plan-summary">
            <p>{mealPlan.length} recipes • Total prep time: {totalPrepTime} minutes</p>
          </div>
          
          <div className="meal-plan-grid">
            {mealPlan.map((recipe, index) => (
              <div key={recipe.id} className="meal-plan-item">
                <div className="plan-number">{index + 1}</div>
                <img src={recipe.image} alt={recipe.name} />
                <div className="plan-details">
                  <Link to={`/recipes/${recipe.id}`}>
                    <h3>{recipe.name}</h3>
                  </Link>
                  <p>{recipe.cuisine} • ⏱️ {recipe.prepTime} min</p>
                </div>
                <button 
                  onClick={() => removeFromMealPlan(recipe.id)}
                  className="remove-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div className="plan-actions">
            <button 
              onClick={() => {
                if (window.confirm('Clear entire meal plan?')) {
                  mealPlan.forEach(recipe => removeFromMealPlan(recipe.id));
                }
              }}
              className="clear-btn"
            >
              Clear All
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default MealPlan;
