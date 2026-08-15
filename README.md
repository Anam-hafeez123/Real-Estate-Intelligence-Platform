# Real Estate Intelligence Platform

An AI-powered real estate intelligence platform that helps users discover, compare, and evaluate properties using natural-language search, market analytics, AI-based property recommendations, location intelligence, and investment insights.

## Overview

The Real Estate Intelligence Platform is a full-stack application designed to make property discovery and investment analysis easier.

Instead of requiring users to manually search through property listings, the platform allows them to describe what they want in natural language. The AI-powered Property Assistant interprets the request, filters suitable properties, calculates matching scores, and provides reasons for its recommendations.

The platform combines:

* AI-powered property search
* Property recommendation and ranking
* Market analytics
* Investment intelligence
* Society and location information
* Nearby amenities
* Interactive property details
* Google Maps integration
* PostgreSQL/PostGIS data storage
* React frontend
* FastAPI backend

## Key Features

### 1. AI Property Assistant

Users can search for properties using natural language.

Example:

```text
Show me plots above 3000 sqft in Lake City
```

The system interprets the request and returns matching properties.

### 2. AI Property Matching

Properties receive an AI match score based on the user's requirements.

The system can also explain why a property was selected using recommendation reasons.

### 3. Property Search

Users can search based on factors such as:

* Society
* Plot size
* Budget
* Corner status
* Location
* Property requirements

### 4. Market Analytics

The dashboard provides market-level information including:

* Total properties
* Average demand price
* Average price per square foot
* Average discount
* Minimum demand price
* Maximum demand price
* Corner and non-corner property statistics

### 5. Property Details

Each property provides detailed information including:

* Plot number
* Society
* Phase
* Block
* Plot size
* Width
* Length
* Facing
* Corner status
* Demand price
* Expected deal price
* AI match score
* AI recommendation
* AI reasoning

### 6. Location Intelligence

Properties containing geographic coordinates can be opened directly in Google Maps.

This allows users to inspect the property's geographical location.

### 7. Nearby Amenities

The platform supports location-based property evaluation by considering nearby amenities and important surrounding facilities.

This helps users evaluate properties beyond price and size.

### 8. Investment Intelligence

The platform includes investment-oriented analysis to help users evaluate potential property opportunities using market and pricing information.

### 9. Interactive Dashboard

The frontend provides a modern dashboard containing:

* Property search
* AI recommendations
* Market statistics
* Property cards
* Property details modal
* Location actions
* Amenity information
* Investment insights

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* Lucide React
* Axios

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic

### Database

* PostgreSQL
* PostGIS

### Intelligence Layer

* Natural-language property search
* Property matching
* Investment scoring
* Market analytics
* Price analysis
* Location intelligence

### External Services

* Google Maps for property locations

## Project Architecture

```text
Real-Estate-Intelligence-Platform/
│
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       │
│       └── services/
│           ├── __init__.py
│           ├── investment_scorer.py
│           ├── market_analytics.py
│           └── price_predictor.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open another terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

## Database Setup

The project uses PostgreSQL with PostGIS for property and geographic data.

Create the database:

```sql
CREATE DATABASE real_estate_intelligence;
```

Enable PostGIS:

```sql
CREATE EXTENSION postgis;
```

The property database stores information such as:

```text
id
society
phase
block
plot_number
size_sqft
width_ft
length_ft
facing
is_corner
owner_name
demand_price
expected_deal_price
location
images
documents
created_at
updated_at
```

## Example Property Search

A user can enter:

```text
Show me corner plots under 50 million
```

The platform processes the request and returns suitable properties with:

* Matching score
* Price information
* Plot size
* Location
* Recommendation
* AI reasoning

Another example:

```text
Show me plots above 3000 sqft in Lake City
```

## API

The backend exposes REST APIs for communicating with the frontend.

Example endpoints include:

```text
GET  /market/overview
POST /assistant/search
```

The API architecture allows the frontend to communicate with the intelligence and database layers independently.

## Intelligence Workflow

```text
User Requirement
       |
       v
AI Property Assistant
       |
       v
Requirement Interpretation
       |
       v
Property Filtering
       |
       v
Property Matching
       |
       v
AI Score + Recommendation
       |
       v
Market & Investment Analysis
       |
       v
Property Results
       |
       v
Location / Amenities
```

## Project Milestones

### Milestone 1 — Society Maps

Implemented property location intelligence and map integration.

### Milestone 2 — Nearby Amenities

Added nearby amenity intelligence to improve property evaluation.

### Milestone 3 — Construction Cost Calculator

Planned module for estimating construction costs based on property size and construction requirements.

### Milestone 4 — ROI / Investment Analysis

Investment-oriented analysis and scoring to help evaluate property opportunities.

### Milestone 5 — Document Management

Planned property document management functionality for storing and organizing property-related documents.

### Milestone 6 — CRM

Planned customer relationship management functionality for managing property leads and interactions.

### Milestone 7 — Final Dashboard

Integrated the major property intelligence features into an interactive dashboard.

### Milestone 8 — Testing and GitHub

Final testing, project organization, documentation, and GitHub version control.

## Current Property Dataset

The platform contains multiple sample properties across societies such as:

* DHA Lahore
* Lake City

The dataset can be expanded with additional properties to demonstrate larger-scale property search and analytics.

## Why This Project?

Traditional property platforms primarily focus on listing properties.

This project focuses on **property intelligence**.

Instead of simply asking:

> "What properties are available?"

the platform helps answer:

> "Which property best matches my requirements, why is it suitable, how does its price compare with the market, and what is around its location?"

This makes the platform useful for:

* Property buyers
* Investors
* Real estate agents
* Property analysts
* Real estate businesses

## Future Improvements

Potential future improvements include:

* User authentication
* Property listing management
* Advanced interactive maps
* Real-time market data
* Construction cost estimation
* Property document management
* CRM and lead management
* Automated property reports
* Advanced investment forecasting
* More comprehensive amenity analysis
* Production deployment
* Mobile application

## Project Status

**Status: Active Development / Portfolio Project**

The core platform is functional with AI-assisted property search, property recommendations, market analytics, investment intelligence, location integration, and an interactive React dashboard.

## Author

**Anam Hafeez**

BS Computer Science

## License

This project is intended for educational, portfolio, and demonstration purposes.
