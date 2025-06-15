from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import csv
import os
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    user_id: str
    interests: Optional[List[str]] = None
    history: Optional[List[str]] = None

class RecommendationRequest(BaseModel):
    user_profile: UserProfile
    num_items: int = 5
    page: int = 1
    query: Optional[str] = None

class RecommendationResponse(BaseModel):
    recommendations: List[dict]
    total: int

# --- RAG Pipeline Components (Stubs) ---
# In a real system, these would use libraries like langchain, llama-cpp-python, sentence-transformers, faiss/chromadb, etc.

def retrieve_documents(user_profile, query, top_k=10):
    # Simulate retrieval: always include the query in the results
    docs = []
    if query:
        docs.append(f"Result for '{query}' (AI generated)")
    # Add some personalized/history-based results
    if user_profile.history:
        docs.extend([f"Because you searched: {h}" for h in user_profile.history[:top_k-1]])
    # Fallback generic content
    while len(docs) < top_k:
        docs.append(f"Popular content {len(docs)+1}")
    return docs[:top_k]

def generate_personalized_response(context_docs, user_profile, query):
    # Simulate LLM response: return the docs as recommendations
    return [
        f"{doc}" for doc in context_docs
    ]

from fastapi import Query

def load_movies_dataset():
    dataset_path = os.path.join(os.path.dirname(__file__), 'dataset', 'MovieGenre.csv')
    movies = []
    with open(dataset_path, encoding='latin1') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            imdb_id = row.get('imdbId')
            poster_path = os.path.join(os.path.dirname(__file__), 'dataset', 'SampleMoviePosters', f"{imdb_id}.jpg")
            if os.path.exists(poster_path):
                row['LocalPoster'] = f"/static/{imdb_id}.jpg"
            movies.append(row)
    return movies

MOVIES_DATASET = load_movies_dataset()

def find_similar_movies(query_title=None, query_genres=None, top_k=None):
    from difflib import SequenceMatcher
    results = []
    for movie in MOVIES_DATASET:
        title = movie.get('Title')
        genres = movie.get('Genre')
        score = 0
        if query_title and title:
            score += SequenceMatcher(None, query_title.lower(), title.lower()).ratio()
        if query_genres and genres:
            for genre in query_genres:
                if genre.lower() in genres.lower():
                    score += 0.5
        if score > 0:
            results.append((score, movie))
    results.sort(reverse=True, key=lambda x: x[0])
    if top_k:
        return [m for _, m in results[:top_k]]
    return [m for _, m in results]

@app.post("/recommend", response_model=RecommendationResponse)
async def recommend_content(req: RecommendationRequest, ai_only: bool = Query(False, description="Return only AI-generated content")):
    query = getattr(req, 'query', None)
    query_title = query if query else (req.user_profile.history[0] if req.user_profile.history else None)
    query_genres = req.user_profile.interests if req.user_profile.interests else None
    
    # Get all matching movies first
    all_matches = find_similar_movies(query_title=query_title, query_genres=query_genres, top_k=len(MOVIES_DATASET))
    total_matches = len(all_matches)
    
    # Calculate pagination
    start_idx = (req.page - 1) * req.num_items
    end_idx = start_idx + req.num_items
    
    # Get paginated results
    paginated_matches = all_matches[start_idx:end_idx]
    
    return RecommendationResponse(
        recommendations=paginated_matches,
        total=total_matches
    )

@app.get("/all-movies")
def get_all_movies():
    movies = load_movies_dataset()
    return JSONResponse(content=movies)