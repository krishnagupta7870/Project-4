# DEALMATE

DEALMATE is an advanced hybrid recommendation system and web application combining behavioral tracking, price-aware filtering, sentiment-based seller modeling, and AI-assisted intent extraction.

## Features

- **Advanced Recommendation Engine**: Hybrid system using behavioral tracking and price-aware filtering.
- **AI Chatbot Integration**: Uses Gemini to extract structured search intent instead of raw text.
- **Sentiment Analysis**: Analyzes review sentiment to score seller interactions without unfairly weighting products.
- **Cold-Start Handling**: Provides nearest and popular products for new users based on location.
- **Collaborative Filtering**: Recommends products based on weighted actions from similar users.

## Project Structure

- `frontend/`: The React-based user interface.
- `backend/`: The server-side application (Node.js).
- `ai_service/`: Python-based AI services (`sentiment.py`, `recommend.py`) for handling advanced logic and intent extraction.

## Getting Started

### Prerequisites

- Node.js
- Python 3.x
- npm

### Installation

To install dependencies for the root, frontend, and backend, run:

```bash
npm run install-all
```

*(This command runs `npm install` in the root, `backend`, and `frontend` directories).*

### Running the Application

To start the frontend, backend, and AI services concurrently, use:

```bash
npm run dev
```

This will spin up:
- Backend server
- Frontend application
- Python sentiment service
- Python recommendation service
