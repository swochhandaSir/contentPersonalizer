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
      <nav className="navbar">
        <div className="navbar-logo">
          <img src={logo} alt="Logo" style={{height: 38, marginRight: 12}} />
          <span className="navbar-title">Content Personalizer</span>
        </div>
        <ul className="navbar-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#movies">Movies</a></li>
          <li><a href="#music">Music</a></li>
          <li><a href="#articles">Articles</a></li>
        </ul>
      </nav>
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
          <div key={idx} className="recommendation-card" style={{boxShadow: '0 4px 16px rgba(25, 118, 210, 0.15)', borderRadius: 16, overflow: 'hidden', background: '#fff', margin: 12, transition: 'transform 0.2s', transform: 'scale(1)', border: '1px solid #e3e3e3', maxWidth: 320}}>
            <img className="recommendation-thumbnail" src={card.Poster_Url || card.LocalPoster || card.Poster || 'https://via.placeholder.com/320x180?text=Thumbnail'} alt="thumbnail" style={{width: '100%', height: 200, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16}} />
            <div className="recommendation-content" style={{padding: 16}}>
              <div className="recommendation-title" style={{fontWeight: 700, fontSize: 20, marginBottom: 8, color: '#1976d2'}}>{card.Title}</div>
              <div className="recommendation-meta" style={{fontSize: 15, marginBottom: 8, color: '#555'}}>
                {card.Genre && <span><b>Genre:</b> {card.Genre} &nbsp;</span>}
                {card.Rating && <span style={{background: '#ffd700', color: '#222', borderRadius: 8, padding: '2px 8px', marginLeft: 8}}><b>★ {card.Rating}</b></span>}
              </div>
              {card.Overview && <div style={{fontSize: 14, color: '#666', marginBottom: 8, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis'}}>{card.Overview}</div>}
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
                <div key={idx} className="recommendation-card" style={{boxShadow: '0 4px 16px rgba(25, 118, 210, 0.15)', borderRadius: 16, overflow: 'hidden', background: '#fff', margin: 12, transition: 'transform 0.2s', transform: 'scale(1)', border: '1px solid #e3e3e3', maxWidth: 320}}>
                  <img className="recommendation-thumbnail" src={card.Poster_Url || card.LocalPoster || card.Poster || 'https://via.placeholder.com/320x180?text=Thumbnail'} alt="thumbnail" style={{width: '100%', height: 200, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16}} />
                  <div className="recommendation-content" style={{padding: 16}}>
                    <div className="recommendation-title" style={{fontWeight: 700, fontSize: 20, marginBottom: 8, color: '#1976d2'}}>{card.Title}</div>
                    <div className="recommendation-meta" style={{fontSize: 15, marginBottom: 8, color: '#555'}}>
                      {card.Genre && <span><b>Genre:</b> {card.Genre} &nbsp;</span>}
                      {card.Rating && <span style={{background: '#ffd700', color: '#222', borderRadius: 8, padding: '2px 8px', marginLeft: 8}}><b>★ {card.Rating}</b></span>}
                    </div>
                    {card.Overview && <div style={{fontSize: 14, color: '#666', marginBottom: 8, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis'}}>{card.Overview}</div>}
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
