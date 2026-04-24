// components/RecipeDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReviewForm from './ReviewForm';
import { recipesData } from '../data/recipes';

function RecipeDetail({ addToMealPlan, mealPlan, removeFromMealPlan }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      const foundRecipe = recipesData.find(r => r.id === parseInt(id));
      if (foundRecipe) {
        setRecipe(foundRecipe);
        setReviews([...foundRecipe.reviews]);
      }
      setLoading(false);
    }, 1000);
  }, [id]);

  const addReview = (newReview) => {
    const reviewWithId = {
      ...newReview,
      id: reviews.length + 1,
      date: new Date().toISOString().split('T')[0]
    };
    setReviews([reviewWithId, ...reviews]);
  };

  const isInMealPlan = mealPlan.some(r => r.id === recipe?.id);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading recipe details...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="not-found">
        <h2>Recipe not found</h2>
        <Link to="/recipes">Back to Recipes</Link>
      </div>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="recipe-detail">
      <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
      
      <div className="detail-header">
        <img src={recipe.image} alt={recipe.name} className="detail-image" />
        <div className="detail-info">
          <h1>{recipe.name}</h1>
          <p className="cuisine">{recipe.cuisine}</p>
          <div className="detail-meta">
            <span className="rating">⭐ {avgRating.toFixed(1)} ({reviews.length} reviews)</span>
            <span className="prep-time">⏱️ {recipe.prepTime} minutes</span>
            <span className="difficulty">📊 {recipe.difficulty}</span>
            {recipe.vegetarian && <span className="veg">🌱 Vegetarian</span>}
          </div>
          <p className="description">{recipe.description}</p>
          
          <div className="action-buttons">
            {!isInMealPlan ? (
              <button onClick={() => addToMealPlan(recipe)} className="add-plan-btn">
                + Add to Meal Plan
              </button>
            ) : (
              <button onClick={() => removeFromMealPlan(recipe.id)} className="remove-plan-btn">
                ✓ Remove from Meal Plan
              </button>
            )}
            <button onClick={handlePrint} className="print-btn">
              🖨️ Print Recipe
            </button>
          </div>
        </div>
      </div>
      
      <div className="detail-content">
        <div className="ingredients-section">
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
        
        <div className="instructions-section">
          <h2>Instructions</h2>
          <ol>
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
        
        <div className="reviews-section">
          <h2>Reviews</h2>
          <ReviewForm onSubmit={addReview} />
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p>No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <strong>{review.user}</strong>
                    <span className="review-rating">⭐ {review.rating}</span>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;
