import React, { useState } from 'react';
import './SearchResults.css';

function SearchResults({ searchQuery, onSearch, setSearchQuery, handleSearchChange, currentSearchQuery }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("Trying to get search results for:", currentSearchQuery);
      const encodedSearchQuery = currentSearchQuery;
      console.log("Encoded Search Query:", encodedSearchQuery);
      const response = await fetch(`http://localhost:80/data/keywords?ingredients=${encodedSearchQuery}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setResults(responseData.results);
      console.log("Search Results:", responseData.data);
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
      <button onClick={handleSearch}>Search</button>
      <div className="card-grid">
        {results.map((result) => (
          <div key={result.id} className="card">
            <h2>{result.title}</h2>
            <p>Ingredients: {result.ingredients}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResults;
