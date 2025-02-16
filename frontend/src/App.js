import { useState } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthSuccess from './components/AuthSuccess';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import LoginWithGoogle from './components/LoginWithGoogle';
import AudioGenerator from './components/AudioGenerator';
import IndexedElements from './components/IndexedElements';
import SearchResults from './components/SearchResults';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (searchQuery) => {
    setSubmittedSearchQuery(searchQuery);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginWithGoogle />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/audio" element={<AudioGenerator />} />
        <Route path="/indexed-elements" element={<IndexedElements />} />
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
      <SearchResults
        searchQuery={submittedSearchQuery}
        onSearch={handleSearchSubmit}
        setSearchQuery={setSearchQuery}
        handleSearchChange={handleSearchChange}
        currentSearchQuery={searchQuery}
      />
    </Router>
  );
}

export default App;
