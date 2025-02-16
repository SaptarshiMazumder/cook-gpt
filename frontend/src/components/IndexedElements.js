import React, { useState, useEffect } from 'react';

function IndexedElements() {
  const [elements, setElements] = useState([]);
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
    <div>
      <h1>Indexed Elements</h1>
      <ul>
        {elements.map((element) => (
          <li key={element.id}>{element.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default IndexedElements;
