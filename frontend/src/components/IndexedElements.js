import React, { useState, useEffect } from 'react';
import './IndexedElements.css';

function IndexedElements() {
  const [elements, setElements] = useState([]);
  const [totalElements, setTotalElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Trying to get all indexed data");
        const response = await fetch('http://localhost:80/data/all-indexed');
        if (!response.ok) {
          throw new Error('HTTP error! status: ' + response.status);
        }
        const responseData = await response.json();
        setElements(responseData.data);
        setTotalElements(responseData.total);
        console.log("Elements:", responseData.data);
        setLoading(false);
      } catch (e) {
        setError(e);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="indexed-elements-container">
      <h1>Indexed Elements ({totalElements})</h1>
      <div className="card-grid">
        {elements.map((element) => (
          <div key={element.id} className="card">
            <h2>{element.title}</h2>
            <p>Ingredients: {element.ingredients}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IndexedElements;
