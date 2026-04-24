// components/ReviewForm.js
import React, { useState } from 'react';

function ReviewForm({ onSubmit }) {
  const [user, setUser] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user.trim() || !comment.trim()) return;
    
    onSubmit({
      user: user.trim(),
      rating: parseFloat(rating),
      comment: comment.trim()
    });
    
    setUser('');
    setRating(5);
    setComment('');
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Write a Review</h3>
      <div className="form-group">
        <input
          type="text"
          placeholder="Your name"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="5"> 5 Stars</option>
          <option value="4."> 4.5 Stars</option>
          <option value="4"> 4 Stars</option>
          <option value="3.5"> 3.5 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2.5"> 2.5 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>
      <div className="form-group">
        <textarea
          placeholder="Share your experience with this recipe..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="3"
          required
        />
      </div>
      <button type="submit" className="submit-review">Submit Review</button>
    </form>
  );
}

export default ReviewForm;
