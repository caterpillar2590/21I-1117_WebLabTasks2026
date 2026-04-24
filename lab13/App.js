// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import MealPlan from './components/MealPlan';
import { recipesData } from './data/recipes';

function App() {
  const [mealPlan, setMealPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load meal plan from localStorage on mount
  useEffect(() => {
    const savedMealPlan = localStorage.getItem('mealPlan');
    if (savedMealPlan) {
      setMealPlan(JSON.parse(savedMealPlan));
    }
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Save meal plan to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  const addToMealPlan = (recipe) => {
    if (!mealPlan.find(item => item.id === recipe.id)) {
      setMealPlan([...mealPlan, recipe]);
    }
  };

  const removeFromMealPlan = (recipeId) => {
    setMealPlan(mealPlan.filter(recipe => recipe.id !== recipeId));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading delicious recipes...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">🍳 Recipe Book</div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/recipes">Recipes</Link>
            <Link to="/meal-plan">Meal Plan ({mealPlan.length})</Link>
          </div>
        </nav>
        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipeList addToMealPlan={addToMealPlan} mealPlan={mealPlan} />} />
            <Route path="/recipes/:id" element={<RecipeDetail addToMealPlan={addToMealPlan} mealPlan={mealPlan} removeFromMealPlan={removeFromMealPlan} />} />
            <Route path="/meal-plan" element={<MealPlan mealPlan={mealPlan} removeFromMealPlan={removeFromMealPlan} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Home Page Component
function HomePage() {
  const featuredRecipes = recipesData.slice(0, 3);
  
  return (
    <div className="home-page">
      <div className="hero">
        <h1>Welcome to Recipe Book</h1>
        <p>Discover amazing recipes from around the world. Save your favorites to your weekly meal plan!</p>
        <Link to="/recipes" className="cta-button">Explore Recipes</Link>
      </div>
      <div className="featured-section">
        <h2>Featured Recipes</h2>
        <div className="featured-grid">
          {featuredRecipes.map(recipe => (
            <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="featured-card">
              <img src={recipe.image} alt={recipe.name} />
              <h3>{recipe.name}</h3>
              <p>{recipe.cuisine} • ⭐ {recipe.rating}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
