import React, { useState } from "react";
import "./SearchResults.css";

function SearchResults({
  searchQuery,
  onSearch,
  setSearchQuery,
  handleSearchChange,
  currentSearchQuery,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("Trying to get search results for:", currentSearchQuery);
      const encodedSearchQuery = currentSearchQuery;
      console.log("Encoded Search Query:", encodedSearchQuery);
      const response = await fetch(
        `http://localhost:80/data/keywords?ingredients=${encodedSearchQuery}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setResults(responseData.results);
      console.log("Search Results:", responseData);
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (currentSearchQuery) {
      fetchData();
      onSearch(currentSearchQuery);
    } else {
      setResults([]);
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="search-results-container">
      <h1>Search Results for: {searchQuery}</h1>
      <input
        type="text"
        placeholder="Search by ingredients..."
        value={currentSearchQuery}
        onChange={handleSearchChange}
      />
      <button onClick={handleSearch} className="search-button">
        Search
      </button>
      <div className="card-grid">
        {results.map((result) => (
          <div key={result.id} className="card-link">
            <div className="card">
              <h2>{result.title}</h2>
              <p>Ingredients: {result.ingredients}</p>
              <button
                onClick={() => handleRecipeClick(result)}
                className="view-details-button"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {isPanelOpen && selectedRecipe && (
        <div className="tab-panel">
          <button onClick={handleClosePanel}>Close</button>
          <h2>{selectedRecipe.title}</h2>
          <p>
            <strong>Ingredients:</strong> {selectedRecipe.ingredients}
          </p>
          <p>
            <strong>Instructions:</strong> {selectedRecipe.instructions}
          </p>
          <p>
            <strong>Preparation Time:</strong> {selectedRecipe.preparationTime}
          </p>
          <p>
            <strong>Difficulty:</strong> {selectedRecipe.difficulty}
          </p>
          <p>
            <strong>Tips:</strong> {selectedRecipe.tips}
          </p>
          <p>
            <strong>Source:</strong> {selectedRecipe.source}
          </p>
          <p>
            <strong>Link:</strong>{" "}
            <a href={selectedRecipe.link}>{selectedRecipe.link}</a>
          </p>
          <p>
            <strong>Tags:</strong> {selectedRecipe.tags.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
