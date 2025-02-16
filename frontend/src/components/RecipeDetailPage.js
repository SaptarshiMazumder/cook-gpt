import React from 'react';
import { useLocation } from 'react-router-dom';

function RecipeDetailPage() {
  const location = useLocation();

  if (!location.state || !location.state.recipe) {
    return <div>Recipe not found</div>;
  }

  const { recipe } = location.state;

  return (
    <div>
      <h1>{recipe.title}</h1>
      <p><strong>Ingredients:</strong> {recipe.ingredients}</p>
      <p><strong>Instructions:</strong> {recipe.instructions}</p>
      <p><strong>Preparation Time:</strong> {recipe.preparationTime}</p>
      <p><strong>Difficulty:</strong> {recipe.difficulty}</p>
      <p><strong>Tips:</strong> {recipe.tips}</p>
      <p><strong>Source:</strong> {recipe.source}</p>
      <p><strong>Link:</strong> <a href={recipe.link}>{recipe.link}</a></p>
      <p><strong>Tags:</strong> {recipe.tags.join(', ')}</p>
    </div>
  );
}

export default RecipeDetailPage;
