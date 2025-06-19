import logo from './logo.svg';
import './App.css';

import React, { useEffect, useState } from 'react';

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allMoviesLoading, setAllMoviesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState(["The Matrix", "Inception"]);
  const [allMovies, setAllMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentMoviesPage, setCurrentMoviesPage] = useState(1);
  const [totalMoviesPages, setTotalMoviesPages] = useState(1);
  const itemsPerPage = 6;

  const fetchRecommendations = async (query, page = 1) => {
    console.log('Setting loading to true');
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_profile: {
            user_id: 'user123',
            interests: ['AI', 'Music', 'Movies'],
            history: history,
          },
          num_items: itemsPerPage,
          page: page,
          query: query || undefined
        })
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err) {
      setError(err.message);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      console.log('Search initiated');
      setHistory(prev => [search, ...prev.filter(q => q !== search)].slice(0, 10));
      setCurrentPage(1); // Reset to first page on new search
      setLoading(true); // Set loading state before fetch
      setTimeout(() => {
        fetchRecommendations(search, 1);
      }, 100); // Small delay to ensure loading state is visible
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchRecommendations(search, newPage);
    }
  };

  const handleMoviesPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalMoviesPages) {
      setCurrentMoviesPage(newPage);
    }
  };

  useEffect(() => {
    setAllMoviesLoading(true);
    fetch("http://localhost:8000/all-movies")
      .then((res) => res.json())
      .then((data) => {
        setAllMovies(data);
        setTotalMoviesPages(Math.ceil(data.length / itemsPerPage));
      })
      .catch((err) => console.error(err))
      .finally(() => setAllMoviesLoading(false));
  }, []);

  // Calculate paginated movies
  const paginatedMovies = allMovies.slice(
    (currentMoviesPage - 1) * itemsPerPage,
    currentMoviesPage * itemsPerPage
  );

  return (
    <div className="App">
      <header className="App-header" style={{background: 'none', color: '#222'}}>
        <h2>Content Personalization Agent</h2>
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for content..."
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <p style={{color: 'red'}}>{error}</p>}
        {loading ? (
  <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
    <h3 style={{ textAlign: 'left', margin: '32px 0 16px 8px', color: '#1976d2' }}>Recommended for you</h3>
    <div className="recommendations-grid">
      {Array(itemsPerPage).fill().map((_, idx) => (
        <div key={`rec-skeleton-${idx}`} className="recommendation-card">
          <div className="skeleton skeleton-thumbnail"></div>
          <div className="recommendation-content">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-meta"></div>
            <div className="skeleton skeleton-meta"></div>
            <div className="skeleton skeleton-meta"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
) : recommendations.length > 0 && (
  <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
    <h3 style={{ textAlign: 'left', margin: '32px 0 16px 8px', color: '#1976d2' }}>Recommended for you</h3>
    <div className="recommendations-grid">
      {recommendations.map((item, idx) => {
        const card = typeof item === 'object' ? item : {};
        return (
          <div key={idx} className="recommendation-card">

                    <img className="recommendation-thumbnail" src={card.LocalPoster || card.Poster || 'https://via.placeholder.com/320x180?text=Thumbnail'} alt="thumbnail" />
                    <div className="recommendation-content">
                      <div className="recommendation-title">{card.Title}</div>
                      <div className="recommendation-meta">
                        {card.imdbId && <span><b>IMDb ID:</b> {card.imdbId} &nbsp;</span>}
                        {card['Imdb Link'] && <span><b>IMDb Link:</b> <a href={card['Imdb Link']} target="_blank" rel="noopener noreferrer">{card['Imdb Link']}</a> &nbsp;</span>}
                        {card['IMDB Score'] && <span><b>IMDB Score:</b> {card['IMDB Score']} &nbsp;</span>}
                        {card.Genre && <span><b>Genre:</b> {card.Genre} &nbsp;</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!loading && recommendations.length > 0 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{width: '100%', maxWidth: 1200, margin: '32px auto 0'}}>
          <h3 style={{textAlign: 'left', margin: '32px 0 16px 8px', color: '#1976d2'}}>All Movies</h3>
          <div className="recommendations-grid">
            {allMoviesLoading ? (
              <>
                {console.log('Rendering skeleton loaders')}
                {Array(itemsPerPage).fill().map((_, idx) => (
                  <div key={`skeleton-${idx}`} className="recommendation-card">
                    <div className="skeleton skeleton-thumbnail"></div>
                    <div className="recommendation-content">
                      <div className="skeleton skeleton-title"></div>
                      <div className="skeleton skeleton-meta"></div>
                      <div className="skeleton skeleton-meta"></div>
                      <div className="skeleton skeleton-meta"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              paginatedMovies.map((card, idx) => (
                <div key={idx} className="recommendation-card">
                  <img className="recommendation-thumbnail" src={card.LocalPoster || card.Poster || 'https://via.placeholder.com/320x180?text=Thumbnail'} alt="thumbnail" />
                  <div className="recommendation-content">
                    <div className="recommendation-title">{card.Title}</div>
                    <div className="recommendation-meta">
                      {card.imdbId && <span><b>IMDb ID:</b> {card.imdbId} &nbsp;</span>}
                      {card['Imdb Link'] && <span><b>IMDb Link:</b> <a href={card['Imdb Link']} target="_blank" rel="noopener noreferrer">{card['Imdb Link']}</a> &nbsp;</span>}
                      {card['IMDB Score'] && <span><b>IMDB Score:</b> {card['IMDB Score']} &nbsp;</span>}
                      {card.Genre && <span><b>Genre:</b> {card.Genre} &nbsp;</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {!allMoviesLoading && allMovies.length > 0 && (
            <div className="pagination">
              <button 
                onClick={() => handleMoviesPageChange(currentMoviesPage - 1)}
                disabled={currentMoviesPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentMoviesPage} of {totalMoviesPages}
              </span>
              <button 
                onClick={() => handleMoviesPageChange(currentMoviesPage + 1)}
                disabled={currentMoviesPage === totalMoviesPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
