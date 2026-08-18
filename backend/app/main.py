import re

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import text

from .database import get_db
from .models import Plot
from .business_modules import router as business_router

from .schemas import (
    PlotCreate,
    PlotResponse,
    PlotUpdate,
    InvestmentScoreResponse,
    MarketOverviewResponse,
    SocietyMarketResponse,
    PricePerSqftResponse,
    PricePredictionResponse,
    RecommendationResponse,
    PropertyAssistantRequest,
    PropertyAssistantResponse,
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Real Estate Intelligence Platform API",
    version="1.0.0"
)
app.include_router(business_router)
# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Real Estate Intelligence Platform API",
        "status": "running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ============================================================
# CREATE PLOT
# ============================================================

@app.post(
    "/plots",
    response_model=PlotResponse,
    status_code=201
)
def create_plot(
    plot: PlotCreate,
    db: Session = Depends(get_db)
):

    plot_data = plot.model_dump(
        exclude={
            "latitude",
            "longitude"
        }
    )

    new_plot = Plot(**plot_data)

    if (
        plot.latitude is not None
        and plot.longitude is not None
    ):
        new_plot.location = (
            f"SRID=4326;"
            f"POINT({plot.longitude} {plot.latitude})"
        )

    db.add(new_plot)
    db.commit()
    db.refresh(new_plot)

    result = (
        db.query(
            Plot,
            func.ST_Y(
                Plot.location
            ).label("latitude"),
            func.ST_X(
                Plot.location
            ).label("longitude")
        )
        .filter(
            Plot.id == new_plot.id
        )
        .first()
    )

    plot_obj, latitude, longitude = result

    data = PlotResponse.model_validate(
        plot_obj
    )

    data.latitude = (
        float(latitude)
        if latitude is not None
        else None
    )

    data.longitude = (
        float(longitude)
        if longitude is not None
        else None
    )

    return data


# ============================================================
# GET ALL PLOTS
# ============================================================

@app.get(
    "/plots",
    response_model=list[PlotResponse]
)
def get_plots(
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            Plot,
            func.ST_Y(
                Plot.location
            ).label("latitude"),
            func.ST_X(
                Plot.location
            ).label("longitude")
        )
        .all()
    )

    response = []

    for plot, latitude, longitude in results:

        data = PlotResponse.model_validate(
            plot
        )

        data.latitude = (
            float(latitude)
            if latitude is not None
            else None
        )

        data.longitude = (
            float(longitude)
            if longitude is not None
            else None
        )

        response.append(data)

    return response


# ============================================================
# SEARCH AND FILTER PLOTS
# ============================================================

@app.get(
    "/plots/search",
    response_model=list[PlotResponse]
)
def search_plots(
    society: str | None = None,
    phase: str | None = None,
    block: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    is_corner: bool | None = None,
    facing: str | None = None,
    min_size: float | None = None,
    max_size: float | None = None,
    db: Session = Depends(get_db)
):

    query = db.query(
        Plot,
        func.ST_Y(
            Plot.location
        ).label("latitude"),
        func.ST_X(
            Plot.location
        ).label("longitude")
    )

    if society:
        query = query.filter(
            Plot.society.ilike(
                f"%{society}%"
            )
        )

    if phase:
        query = query.filter(
            Plot.phase.ilike(
                f"%{phase}%"
            )
        )

    if block:
        query = query.filter(
            Plot.block.ilike(
                f"%{block}%"
            )
        )

    if min_price is not None:
        query = query.filter(
            Plot.demand_price >= min_price
        )

    if max_price is not None:
        query = query.filter(
            Plot.demand_price <= max_price
        )

    if is_corner is not None:
        query = query.filter(
            Plot.is_corner == is_corner
        )

    if facing:
        query = query.filter(
            Plot.facing.ilike(
                f"%{facing}%"
            )
        )

    if min_size is not None:
        query = query.filter(
            Plot.size_sqft >= min_size
        )

    if max_size is not None:
        query = query.filter(
            Plot.size_sqft <= max_size
        )

    results = query.all()

    response = []

    for plot, latitude, longitude in results:

        data = PlotResponse.model_validate(
            plot
        )

        data.latitude = (
            float(latitude)
            if latitude is not None
            else None
        )

        data.longitude = (
            float(longitude)
            if longitude is not None
            else None
        )

        response.append(data)

    return response


# ============================================================
# NEARBY PLOTS
# ============================================================

@app.get(
    "/plots/nearby",
    response_model=list[PlotResponse]
)
def nearby_plots(
    latitude: float,
    longitude: float,
    radius_km: float = 5,
    db: Session = Depends(get_db)
):

    radius_meters = radius_km * 1000

    search_point = func.ST_SetSRID(
        func.ST_MakePoint(
            longitude,
            latitude
        ),
        4326
    )

    distance_meters = func.ST_Distance(
        func.Geography(
            Plot.location
        ),
        func.Geography(
            search_point
        )
    )

    results = (
        db.query(
            Plot,
            func.ST_Y(
                Plot.location
            ).label("plot_latitude"),
            func.ST_X(
                Plot.location
            ).label("plot_longitude"),
            distance_meters.label(
                "distance_meters"
            )
        )
        .filter(
            Plot.location.isnot(None)
        )
        .filter(
            func.ST_DWithin(
                func.Geography(
                    Plot.location
                ),
                func.Geography(
                    search_point
                ),
                radius_meters
            )
        )
        .order_by(
            distance_meters.asc()
        )
        .all()
    )

    response = []

    for (
        plot,
        plot_latitude,
        plot_longitude,
        distance_m
    ) in results:

        data = PlotResponse.model_validate(
            plot
        )

        data.latitude = (
            float(plot_latitude)
            if plot_latitude is not None
            else None
        )

        data.longitude = (
            float(plot_longitude)
            if plot_longitude is not None
            else None
        )

        data.distance_km = round(
            float(distance_m) / 1000,
            2
        )

        response.append(data)

    return response


# ============================================================
# PROPERTY RECOMMENDATIONS
# IMPORTANT:
# MUST BE BEFORE /plots/{plot_id}
# ============================================================

@app.get(
    "/plots/recommendations",
    response_model=list[RecommendationResponse]
)
def get_recommendations(
    max_price: float | None = None,
    min_size: float | None = None,
    facing: str | None = None,
    corner_only: bool = False,
    society: str | None = None,
    db: Session = Depends(get_db)
):

    query = db.query(Plot)

    # --------------------------------------------------------
    # FILTERS
    # --------------------------------------------------------

    if max_price is not None:

        query = query.filter(
            Plot.demand_price <= max_price
        )

    if min_size is not None:

        query = query.filter(
            Plot.size_sqft >= min_size
        )

    if facing:

        query = query.filter(
            Plot.facing.ilike(
                f"%{facing}%"
            )
        )

    if corner_only:

        query = query.filter(
            Plot.is_corner.is_(True)
        )

    if society:

        query = query.filter(
            Plot.society.ilike(
                f"%{society}%"
            )
        )

    plots = query.all()

    recommendations = []

    for plot in plots:

        score = 0.0
        reasons = []

        # ----------------------------------------------------
        # PRICE SCORE
        # ----------------------------------------------------

        if (
            max_price is not None
            and plot.demand_price is not None
        ):

            price = float(
                plot.demand_price
            )

            if price <= max_price * 0.80:

                score += 30

                reasons.append(
                    "Very attractive price"
                )

            elif price <= max_price * 0.90:

                score += 25

                reasons.append(
                    "Good price within budget"
                )

            else:

                score += 20

                reasons.append(
                    "Within selected budget"
                )

        elif plot.demand_price is not None:

            score += 15

            reasons.append(
                "Price information available"
            )

        # ----------------------------------------------------
        # SIZE SCORE
        # ----------------------------------------------------

        if plot.size_sqft is not None:

            size = float(
                plot.size_sqft
            )

            if min_size is not None:

                if size >= min_size * 1.25:

                    score += 25

                    reasons.append(
                        "Excellent plot size"
                    )

                elif size >= min_size:

                    score += 20

                    reasons.append(
                        "Meets required plot size"
                    )

            else:

                if size >= 5000:

                    score += 25

                    reasons.append(
                        "Large plot size"
                    )

                elif size >= 3000:

                    score += 20

                    reasons.append(
                        "Good plot size"
                    )

                else:

                    score += 10

        # ----------------------------------------------------
        # CORNER
        # ----------------------------------------------------

        if plot.is_corner:

            score += 15

            reasons.append(
                "Corner plot"
            )

        # ----------------------------------------------------
        # FACING
        # ----------------------------------------------------

        if plot.facing:

            if (
                facing
                and plot.facing.lower()
                == facing.lower()
            ):

                score += 10

                reasons.append(
                    f"Preferred {plot.facing} facing"
                )

            else:

                score += 5

                reasons.append(
                    f"{plot.facing} facing"
                )

        # ----------------------------------------------------
        # DEAL POTENTIAL
        # ----------------------------------------------------

        if (
            plot.demand_price is not None
            and plot.expected_deal_price is not None
            and float(plot.demand_price) > 0
        ):

            demand = float(
                plot.demand_price
            )

            deal = float(
                plot.expected_deal_price
            )

            discount = (
                (demand - deal)
                / demand
            ) * 100

            if discount >= 10:

                score += 10

                reasons.append(
                    "Strong negotiation potential"
                )

            elif discount >= 5:

                score += 7

                reasons.append(
                    "Good negotiation potential"
                )

            elif discount > 0:

                score += 4

                reasons.append(
                    "Some negotiation potential"
                )

        # ----------------------------------------------------
        # SOCIETY
        # ----------------------------------------------------

        if society and plot.society:

            reasons.append(
                f"Located in {plot.society}"
            )

        # ----------------------------------------------------
        # SCORE LIMIT
        # ----------------------------------------------------

        score = min(
            round(score, 2),
            100
        )

        # ----------------------------------------------------
        # RECOMMENDATION
        # ----------------------------------------------------

        if score >= 80:

            recommendation = "Highly Recommended"

        elif score >= 65:

            recommendation = "Recommended"

        elif score >= 50:

            recommendation = "Good Option"

        else:

            recommendation = "Consider Carefully"

        if not reasons:

            reasons.append(
                "Limited property information available"
            )

        # ----------------------------------------------------
        # GPS
        # ----------------------------------------------------

        latitude = None
        longitude = None

        location_result = (
            db.query(
                func.ST_Y(
                    Plot.location
                ).label("latitude"),

                func.ST_X(
                    Plot.location
                ).label("longitude")
            )
            .filter(
                Plot.id == plot.id
            )
            .first()
        )

        if location_result:

            latitude, longitude = (
                location_result
            )

            if latitude is not None:

                latitude = float(
                    latitude
                )

            if longitude is not None:

                longitude = float(
                    longitude
                )

        recommendations.append(
            RecommendationResponse(
                plot_id=plot.id,
                plot_number=plot.plot_number,
                society=plot.society,

                match_score=score,
                recommendation=recommendation,

                reasons=reasons,

                demand_price=(
                    float(plot.demand_price)
                    if plot.demand_price is not None
                    else None
                ),

                expected_deal_price=(
                    float(
                        plot.expected_deal_price
                    )
                    if plot.expected_deal_price is not None
                    else None
                ),

                size_sqft=(
                    float(plot.size_sqft)
                    if plot.size_sqft is not None
                    else None
                ),

                facing=plot.facing,

                is_corner=bool(
                    plot.is_corner
                ),

                latitude=latitude,
                longitude=longitude
            )
        )

    recommendations.sort(
        key=lambda x: x.match_score,
        reverse=True
    )

    return recommendations


# ============================================================
# AI PROPERTY ASSISTANT
# ============================================================

@app.post(
    "/assistant/search",
    response_model=PropertyAssistantResponse
)
def property_assistant(
    request: PropertyAssistantRequest,
    db: Session = Depends(get_db)
):

    query_text = request.query.strip()

    if not query_text:

        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty"
        )

    text = query_text.lower()

    # ========================================================
    # INITIALIZE VARIABLES
    # ========================================================

    min_size = None
    max_size = None
    min_price = None
    max_price = None

    query = db.query(Plot)

    filters = {}

    # ========================================================
    # INTENT DETECTION
    # ========================================================

    intent = "property_search"

    if any(
        word in text
        for word in [
            "price",
            "cheap",
            "cheapest",
            "budget",
            "under",
            "below",
            "less than",
            "million",
            "crore"
        ]
    ):

        intent = "price_search"

    elif any(
        word in text
        for word in [
            "recommend",
            "recommended",
            "best",
            "suggest",
            "suitable"
        ]
    ):

        intent = "recommendation_search"

    elif any(
        word in text
        for word in [
            "corner",
            "facing",
            "size",
            "sqft",
            "plot"
        ]
    ):

        intent = "property_search"

    # ========================================================
    # SOCIETY
    # ========================================================

    society = None

    if "dha lahore" in text:

        society = "DHA Lahore"

    elif "bahria town" in text:

        society = "Bahria Town"

    elif "lake city" in text:

        society = "Lake City"

    if society:

        query = query.filter(
            Plot.society.ilike(
                f"%{society}%"
            )
        )

        filters["society"] = society

    # ========================================================
    # PHASE
    # ========================================================

    phase_match = re.search(
        r"phase\s*([0-9]+)",
        text
    )

    if phase_match:

        phase = (
            f"Phase {phase_match.group(1)}"
        )

        query = query.filter(
            Plot.phase.ilike(
                f"%{phase}%"
            )
        )

        filters["phase"] = phase

    # ========================================================
    # BLOCK
    # ========================================================

    block_match = re.search(
        r"block\s*([a-z0-9]+)",
        text
    )

    if block_match:

        block = (
            f"Block {block_match.group(1)}"
        )

        query = query.filter(
            Plot.block.ilike(
                f"%{block}%"
            )
        )

        filters["block"] = block

    # ========================================================
    # CORNER
    # ========================================================

    if "corner" in text:

        query = query.filter(
            Plot.is_corner.is_(True)
        )

        filters["is_corner"] = True

    # ========================================================
    # FACING
    # ========================================================

    for direction in (
        "north",
        "south",
        "east",
        "west"
    ):

        if direction in text:

            query = query.filter(
                Plot.facing.ilike(
                    f"%{direction}%"
                )
            )

            filters["facing"] = (
                direction.capitalize()
            )

            break

    # ========================================================
    # MINIMUM SIZE
    # ========================================================

    min_size_match = re.search(
    r"(?:at least|minimum|min|above|over|more than|greater than)\s*"
    r"([0-9,]+)\s*"
    r"(?:sqft|sq\s*ft|square feet)",
    text
)
    if min_size_match:

        min_size = float(
            min_size_match.group(1)
            .replace(",", "")
        )

        query = query.filter(
            Plot.size_sqft >= min_size
        )

        filters["min_size_sqft"] = min_size

    # ========================================================
    # MAXIMUM SIZE
    # ========================================================

    max_size_match = re.search(
        r"(?:under|below|less than|max(?:imum)?)\s*"
        r"([0-9,]+)\s*"
        r"(?:sqft|sq\s*ft|square feet)",
        text
    )

    if max_size_match:

        max_size = float(
            max_size_match.group(1)
            .replace(",", "")
        )

        query = query.filter(
            Plot.size_sqft <= max_size
        )

        filters["max_size_sqft"] = max_size

    # ========================================================
    # MAXIMUM PRICE - MILLION
    # ========================================================

    million_match = re.search(
        r"(?:under|below|less than|max(?:imum)?)\s*"
        r"(?:rs\.?|pkr)?\s*"
        r"([0-9]+(?:\.[0-9]+)?)\s*"
        r"(?:million|m)\b",
        text
    )

    if million_match:

        max_price = (
            float(
                million_match.group(1)
            )
            * 1_000_000
        )

    else:

        # ----------------------------------------------------
        # MAXIMUM PRICE - CRORE
        # ----------------------------------------------------

        crore_match = re.search(
            r"(?:under|below|less than|max(?:imum)?)\s*"
            r"([0-9]+(?:\.[0-9]+)?)\s*crore",
            text
        )

        if crore_match:

            max_price = (
                float(
                    crore_match.group(1)
                )
                * 10_000_000
            )

    if max_price is not None:

        query = query.filter(
            Plot.demand_price <= max_price
        )

        filters["max_price"] = max_price

    # ========================================================
    # MINIMUM PRICE - MILLION
    # ========================================================

    min_price_match = re.search(
        r"(?:above|over|more than|minimum|min)\s*"
        r"(?:rs\.?|pkr)?\s*"
        r"([0-9]+(?:\.[0-9]+)?)\s*"
        r"(?:million|m)\b",
        text
    )

    if min_price_match:

        min_price = (
            float(
                min_price_match.group(1)
            )
            * 1_000_000
        )

        query = query.filter(
            Plot.demand_price >= min_price
        )

        filters["min_price"] = min_price

    # ========================================================
    # FETCH PLOTS
    # ========================================================

    plots = (
        query
        .order_by(
            Plot.demand_price.asc()
        )
        .all()
    )

    # ========================================================
    # BUILD RESULTS
    # ========================================================

    results = []

    for plot in plots:

        score = 0.0

        reasons = []

        # ====================================================
        # PRICE
        # ====================================================

        if plot.demand_price is not None:

            price = float(
                plot.demand_price
            )

            if max_price is not None:

                if price <= max_price * 0.80:

                    score += 30

                    reasons.append(
                        "Very attractive price"
                    )

                elif price <= max_price * 0.90:

                    score += 25

                    reasons.append(
                        "Good price within budget"
                    )

                else:

                    score += 20

                    reasons.append(
                        "Within selected budget"
                    )

            else:

                score += 15

                reasons.append(
                    "Price information available"
                )

        # ====================================================
        # SIZE
        # ====================================================

        if plot.size_sqft is not None:

            size = float(
                plot.size_sqft
            )

            if min_size is not None:

                if size >= min_size * 1.25:

                    score += 25

                    reasons.append(
                        "Excellent plot size"
                    )

                elif size >= min_size:

                    score += 20

                    reasons.append(
                        "Meets required plot size"
                    )

            else:

                if size >= 5000:

                    score += 25

                    reasons.append(
                        "Large plot size"
                    )

                elif size >= 3000:

                    score += 20

                    reasons.append(
                        "Good plot size"
                    )

                else:

                    score += 10

        # ====================================================
        # CORNER
        # ====================================================

        if plot.is_corner:

            score += 15

            reasons.append(
                "Corner plot"
            )

        # ====================================================
        # FACING
        # ====================================================

        if plot.facing:

            preferred_facing = (
                filters.get("facing")
            )

            if (
                preferred_facing
                and plot.facing.lower()
                == preferred_facing.lower()
            ):

                score += 10

                reasons.append(
                    f"Preferred {plot.facing} facing"
                )

            else:

                score += 5

                reasons.append(
                    f"{plot.facing} facing"
                )

        # ====================================================
        # DEAL POTENTIAL
        # ====================================================

        if (
            plot.demand_price is not None
            and plot.expected_deal_price is not None
            and float(plot.demand_price) > 0
        ):

            demand = float(
                plot.demand_price
            )

            deal = float(
                plot.expected_deal_price
            )

            discount = (
                (demand - deal)
                / demand
            ) * 100

            if discount >= 10:

                score += 10

                reasons.append(
                    "Strong negotiation potential"
                )

            elif discount >= 5:

                score += 7

                reasons.append(
                    "Good negotiation potential"
                )

            elif discount > 0:

                score += 4

                reasons.append(
                    "Some negotiation potential"
                )

        # ====================================================
        # FINAL SCORE
        # ====================================================

        score = min(
            round(score, 2),
            100
        )

        if score >= 80:

            recommendation = (
                "Highly Recommended"
            )

        elif score >= 65:

            recommendation = (
                "Recommended"
            )

        elif score >= 50:

            recommendation = (
                "Good Option"
            )

        else:

            recommendation = (
                "Consider Carefully"
            )

        if not reasons:

            reasons.append(
                "Limited property information available"
            )

        # ====================================================
        # GPS
        # ====================================================

        latitude = None
        longitude = None

        if plot.location is not None:

            location_result = (
                db.query(
                    func.ST_Y(
                        Plot.location
                    ).label("latitude"),

                    func.ST_X(
                        Plot.location
                    ).label("longitude")
                )
                .filter(
                    Plot.id == plot.id
                )
                .first()
            )

            if location_result:

                latitude, longitude = (
                    location_result
                )

                if latitude is not None:

                    latitude = float(
                        latitude
                    )

                if longitude is not None:

                    longitude = float(
                        longitude
                    )

        # ====================================================
        # ADD RESULT
        # ====================================================

        results.append(
            RecommendationResponse(
                plot_id=plot.id,

                plot_number=plot.plot_number,

                society=plot.society,

                match_score=score,

                recommendation=recommendation,

                reasons=reasons,

                demand_price=(
                    float(
                        plot.demand_price
                    )
                    if plot.demand_price is not None
                    else None
                ),

                expected_deal_price=(
                    float(
                        plot.expected_deal_price
                    )
                    if plot.expected_deal_price is not None
                    else None
                ),

                size_sqft=(
                    float(
                        plot.size_sqft
                    )
                    if plot.size_sqft is not None
                    else None
                ),

                facing=plot.facing,

                is_corner=bool(
                    plot.is_corner
                ),

                latitude=latitude,

                longitude=longitude
            )
        )

    # ========================================================
    # SORT
    # ========================================================

    results.sort(
        key=lambda x: x.match_score,
        reverse=True
    )

    # ========================================================
    # MESSAGE
    # ========================================================

    if results:

        message = (
            f"Found {len(results)} matching plot(s) "
            "based on your requirements."
        )

    else:

        message = (
            "No plots matched your requirements."
        )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return PropertyAssistantResponse(
        query=query_text,

        intent=intent,

        message=message,

        interpreted_filters=filters,

        plots=results,

        total_results=len(results)
    )


# ============================================================
# GET SINGLE PLOT
# IMPORTANT:
# KEEP AFTER /plots/recommendations
# ============================================================

@app.get(
    "/plots/{plot_id}",
    response_model=PlotResponse
)
def get_plot(
    plot_id: int,
    db: Session = Depends(get_db)
):

    result = (
        db.query(
            Plot,

            func.ST_Y(
                Plot.location
            ).label("latitude"),

            func.ST_X(
                Plot.location
            ).label("longitude")
        )
        .filter(
            Plot.id == plot_id
        )
        .first()
    )

    if not result:

        raise HTTPException(
            status_code=404,
            detail="Plot not found"
        )

    plot, latitude, longitude = result

    data = PlotResponse.model_validate(
        plot
    )

    data.latitude = (
        float(latitude)
        if latitude is not None
        else None
    )

    data.longitude = (
        float(longitude)
        if longitude is not None
        else None
    )

    return data


# ============================================================
# UPDATE PLOT
# ============================================================

@app.put(
    "/plots/{plot_id}",
    response_model=PlotResponse
)
def update_plot(
    plot_id: int,
    plot_data: PlotUpdate,
    db: Session = Depends(get_db)
):

    plot = (
        db.query(Plot)
        .filter(
            Plot.id == plot_id
        )
        .first()
    )

    if not plot:

        raise HTTPException(
            status_code=404,
            detail="Plot not found"
        )

    update_data = plot_data.model_dump(
        exclude_unset=True
    )

    latitude = update_data.pop(
        "latitude",
        None
    )

    longitude = update_data.pop(
        "longitude",
        None
    )

    for field, value in update_data.items():

        setattr(
            plot,
            field,
            value
        )

    if (
        latitude is not None
        and longitude is not None
    ):

        plot.location = (
            f"SRID=4326;"
            f"POINT({longitude} {latitude})"
        )

    db.commit()
    db.refresh(plot)

    result = (
        db.query(
            Plot,

            func.ST_Y(
                Plot.location
            ).label("latitude"),

            func.ST_X(
                Plot.location
            ).label("longitude")
        )
        .filter(
            Plot.id == plot_id
        )
        .first()
    )

    (
        updated_plot,
        updated_latitude,
        updated_longitude
    ) = result

    data = PlotResponse.model_validate(
        updated_plot
    )

    data.latitude = (
        float(updated_latitude)
        if updated_latitude is not None
        else None
    )

    data.longitude = (
        float(updated_longitude)
        if updated_longitude is not None
        else None
    )

    return data


# ============================================================
# DELETE PLOT
# ============================================================

@app.delete(
    "/plots/{plot_id}"
)
def delete_plot(
    plot_id: int,
    db: Session = Depends(get_db)
):

    plot = (
        db.query(Plot)
        .filter(
            Plot.id == plot_id
        )
        .first()
    )

    if not plot:

        raise HTTPException(
            status_code=404,
            detail="Plot not found"
        )

    db.delete(plot)
    db.commit()

    return {
        "message": "Plot deleted successfully",
        "plot_id": plot_id
    }


# ============================================================
# INVESTMENT SCORE
# ============================================================

@app.get(
    "/plots/{plot_id}/investment-score",
    response_model=InvestmentScoreResponse
)
def investment_score(
    plot_id: int,
    db: Session = Depends(get_db)
):

    plot = (
        db.query(Plot)
        .filter(
            Plot.id == plot_id
        )
        .first()
    )

    if not plot:

        raise HTTPException(
            status_code=404,
            detail="Plot not found"
        )

    demand = float(
        plot.demand_price or 0
    )

    deal = float(
        plot.expected_deal_price or 0
    )

    size = float(
        plot.size_sqft or 0
    )

    width = float(
        plot.width_ft or 0
    )

    length = float(
        plot.length_ft or 0
    )

    # --------------------------------------------------------
    # DISCOUNT
    # --------------------------------------------------------

    if (
        demand > 0
        and deal > 0
    ):

        discount_percentage = (
            (demand - deal)
            / demand
        ) * 100

    else:

        discount_percentage = 0

    # --------------------------------------------------------
    # DEAL POTENTIAL
    # --------------------------------------------------------

    deal_potential = min(
        max(
            discount_percentage * 4,
            0
        ),
        40
    )

    # --------------------------------------------------------
    # SIZE SCORE
    # --------------------------------------------------------

    plot_size_score = min(
        (size / 5000) * 30,
        30
    )

    # --------------------------------------------------------
    # CORNER SCORE
    # --------------------------------------------------------

    corner_score = (
        15
        if plot.is_corner
        else 0
    )

    # --------------------------------------------------------
    # DIMENSIONS
    # --------------------------------------------------------

    dimensions_score = 0

    if width >= 40:

        dimensions_score += 7.5

    if length >= 80:

        dimensions_score += 7.5

    # --------------------------------------------------------
    # FINAL SCORE
    # --------------------------------------------------------

    investment_score = (
        deal_potential
        + plot_size_score
        + corner_score
        + dimensions_score
    )

    investment_score = min(
        round(
            investment_score,
            2
        ),
        100
    )

    # --------------------------------------------------------
    # RECOMMENDATION
    # --------------------------------------------------------

    if investment_score >= 80:

        recommendation = (
            "Excellent Investment"
        )

    elif investment_score >= 65:

        recommendation = (
            "Good Investment"
        )

    elif investment_score >= 50:

        recommendation = (
            "Moderate Investment"
        )

    else:

        recommendation = (
            "Low Investment Potential"
        )

    return {
        "plot_id": plot.id,

        "plot_number": plot.plot_number,

        "society": plot.society,

        "investment_score": investment_score,

        "recommendation": recommendation,

        "factors": {
            "deal_potential": round(
                deal_potential,
                2
            ),

            "plot_size": round(
                plot_size_score,
                2
            ),

            "corner_plot": corner_score,

            "dimensions": round(
                dimensions_score,
                2
            )
        },

        "metrics": {
            "demand_price": demand,

            "expected_deal_price": deal,

            "discount_percentage": round(
                discount_percentage,
                2
            ),

            "size_sqft": size,

            "width_ft": width,

            "length_ft": length,

            "is_corner": plot.is_corner
        }
    }


# ============================================================
# MARKET OVERVIEW
# ============================================================

@app.get(
    "/market/overview",
    response_model=MarketOverviewResponse
)
def market_overview(
    db: Session = Depends(get_db)
):

    plots = db.query(
        Plot
    ).all()

    total_plots = len(
        plots
    )

    if total_plots == 0:

        return {
            "total_plots": 0,

            "average_demand_price": None,

            "average_expected_deal_price": None,

            "minimum_demand_price": None,

            "maximum_demand_price": None,

            "average_price_per_sqft": None,

            "average_discount_percentage": None,

            "corner_plots": 0,

            "non_corner_plots": 0
        }

    demand_prices = [
        float(p.demand_price)
        for p in plots
        if p.demand_price is not None
    ]

    deal_prices = [
        float(p.expected_deal_price)
        for p in plots
        if p.expected_deal_price is not None
    ]

    price_per_sqft_values = []

    discount_values = []

    for p in plots:

        if (
            p.demand_price is not None
            and p.size_sqft
            and float(p.size_sqft) > 0
        ):

            price_per_sqft_values.append(
                float(p.demand_price)
                / float(p.size_sqft)
            )

        if (
            p.demand_price is not None
            and p.expected_deal_price is not None
            and float(p.demand_price) > 0
        ):

            discount_values.append(
                (
                    (
                        float(p.demand_price)
                        - float(
                            p.expected_deal_price
                        )
                    )
                    / float(p.demand_price)
                )
                * 100
            )

    return {
        "total_plots": total_plots,

        "average_demand_price": (
            round(
                sum(demand_prices)
                / len(demand_prices),
                2
            )
            if demand_prices
            else None
        ),

        "average_expected_deal_price": (
            round(
                sum(deal_prices)
                / len(deal_prices),
                2
            )
            if deal_prices
            else None
        ),

        "minimum_demand_price": (
            min(demand_prices)
            if demand_prices
            else None
        ),

        "maximum_demand_price": (
            max(demand_prices)
            if demand_prices
            else None
        ),

        "average_price_per_sqft": (
            round(
                sum(price_per_sqft_values)
                / len(price_per_sqft_values),
                2
            )
            if price_per_sqft_values
            else None
        ),

        "average_discount_percentage": (
            round(
                sum(discount_values)
                / len(discount_values),
                2
            )
            if discount_values
            else None
        ),

        "corner_plots": sum(
            1
            for p in plots
            if p.is_corner
        ),

        "non_corner_plots": sum(
            1
            for p in plots
            if not p.is_corner
        )
    }


# ============================================================
# SOCIETY MARKET ANALYSIS
# ============================================================

@app.get(
    "/market/societies",
    response_model=list[SocietyMarketResponse]
)
def society_market_analysis(
    db: Session = Depends(get_db)
):

    societies = (
        db.query(
            Plot.society
        )
        .distinct()
        .all()
    )

    response = []

    for (
        society_name,
    ) in societies:

        plots = (
            db.query(
                Plot
            )
            .filter(
                Plot.society
                == society_name
            )
            .all()
        )

        demand_prices = [
            float(p.demand_price)
            for p in plots
            if p.demand_price is not None
        ]

        deal_prices = [
            float(
                p.expected_deal_price
            )
            for p in plots
            if p.expected_deal_price is not None
        ]

        ppsf_values = [
            float(p.demand_price)
            / float(p.size_sqft)
            for p in plots
            if (
                p.demand_price is not None
                and p.size_sqft is not None
                and float(p.size_sqft) > 0
            )
        ]

        response.append({

            "society": society_name,

            "total_plots": len(
                plots
            ),

            "average_demand_price": (
                round(
                    sum(demand_prices)
                    / len(demand_prices),
                    2
                )
                if demand_prices
                else None
            ),

            "average_expected_deal_price": (
                round(
                    sum(deal_prices)
                    / len(deal_prices),
                    2
                )
                if deal_prices
                else None
            ),

            "average_price_per_sqft": (
                round(
                    sum(ppsf_values)
                    / len(ppsf_values),
                    2
                )
                if ppsf_values
                else None
            )
        })

    return response


# ============================================================
# PRICE PER SQFT
# ============================================================

@app.get(
    "/market/price-per-sqft",
    response_model=list[PricePerSqftResponse]
)
def price_per_sqft(
    db: Session = Depends(get_db)
):

    plots = (
        db.query(
            Plot
        )
        .filter(
            Plot.size_sqft.isnot(None),

            Plot.demand_price.isnot(None),

            Plot.size_sqft > 0
        )
        .all()
    )

    response = []

    for plot in plots:

        size = float(
            plot.size_sqft
        )

        demand = float(
            plot.demand_price
        )

        response.append({

            "plot_id": plot.id,

            "plot_number": plot.plot_number,

            "society": plot.society,

            "size_sqft": size,

            "demand_price": demand,

            "price_per_sqft": round(
                demand / size,
                2
            )
        })

    return response


# ============================================================
# PRICE PREDICTION
# ============================================================

@app.get(
    "/plots/{plot_id}/price-prediction",
    response_model=PricePredictionResponse
)
def price_prediction(
    plot_id: int,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # FIND PLOT
    # --------------------------------------------------------

    plot = (
        db.query(
            Plot
        )
        .filter(
            Plot.id == plot_id
        )
        .first()
    )

    if not plot:

        raise HTTPException(
            status_code=404,
            detail="Plot not found"
        )

    # --------------------------------------------------------
    # CHECK BASIC DATA
    # --------------------------------------------------------

    if (
        plot.size_sqft is None
        or plot.demand_price is None
    ):

        return {
            "plot_id": plot.id,

            "plot_number": plot.plot_number,

            "prediction_available": False,

            "predicted_market_price": None,

            "price_per_sqft": None,

            "current_demand_price": (
                float(plot.demand_price)
                if plot.demand_price is not None
                else None
            ),

            "price_difference": None,

            "difference_percentage": None,

            "prediction_status": (
                "Insufficient Data"
            ),

            "comparable_plots": 0,

            "adjustment_percentage": None,

            "method": (
                "Comparable Market Analysis"
            ),

            "message": (
                "Plot size and demand price "
                "are required."
            )
        }

    size = float(
        plot.size_sqft
    )

    demand = float(
        plot.demand_price
    )

    # --------------------------------------------------------
    # FIND COMPARABLE PLOTS
    # Same society
    # Similar size (+/- 20%)
    # --------------------------------------------------------

    comparable_plots = (
        db.query(
            Plot
        )
        .filter(

            Plot.id != plot.id,

            Plot.society
            == plot.society,

            Plot.size_sqft.isnot(None),

            Plot.demand_price.isnot(None),

            Plot.size_sqft.between(
                size * 0.8,
                size * 1.2
            )
        )
        .all()
    )

    # --------------------------------------------------------
    # NO COMPARABLES
    # --------------------------------------------------------

    if not comparable_plots:

        return {

            "plot_id": plot.id,

            "plot_number": plot.plot_number,

            "prediction_available": False,

            "predicted_market_price": None,

            "price_per_sqft": round(
                demand / size,
                2
            ),

            "current_demand_price": demand,

            "price_difference": None,

            "difference_percentage": None,

            "prediction_status": (
                "Insufficient Comparables"
            ),

            "comparable_plots": 0,

            "adjustment_percentage": None,

            "method": (
                "Comparable Market Analysis"
            ),

            "message": (
                "No comparable plots "
                "were found."
            )
        }

    # --------------------------------------------------------
    # CALCULATE COMPARABLE PRICE/SQFT
    # --------------------------------------------------------

    comparable_ppsf = []

    for comparable in comparable_plots:

        comparable_size = float(
            comparable.size_sqft
        )

        comparable_price = float(
            comparable.demand_price
        )

        if comparable_size > 0:

            comparable_ppsf.append(
                comparable_price
                / comparable_size
            )

    # --------------------------------------------------------
    # INVALID COMPARABLE DATA
    # --------------------------------------------------------

    if not comparable_ppsf:

        return {

            "plot_id": plot.id,

            "plot_number": plot.plot_number,

            "prediction_available": False,

            "predicted_market_price": None,

            "price_per_sqft": round(
                demand / size,
                2
            ),

            "current_demand_price": demand,

            "price_difference": None,

            "difference_percentage": None,

            "prediction_status": (
                "Insufficient Comparables"
            ),

            "comparable_plots": 0,

            "adjustment_percentage": None,

            "method": (
                "Comparable Market Analysis"
            ),

            "message": (
                "Comparable plots do not "
                "contain valid size data."
            )
        }

    # --------------------------------------------------------
    # AVERAGE COMPARABLE PRICE/SQFT
    # --------------------------------------------------------

    average_ppsf = (
        sum(comparable_ppsf)
        / len(comparable_ppsf)
    )

    # --------------------------------------------------------
    # PREDICT MARKET PRICE
    # --------------------------------------------------------

    predicted_market_price = (
        average_ppsf
        * size
    )

    # --------------------------------------------------------
    # CURRENT PRICE/SQFT
    # --------------------------------------------------------

    current_ppsf = (
        demand
        / size
    )

    # --------------------------------------------------------
    # PRICE DIFFERENCE
    # --------------------------------------------------------

    price_difference = (
        predicted_market_price
        - demand
    )

    # --------------------------------------------------------
    # DIFFERENCE %
    # --------------------------------------------------------

    difference_percentage = (
        price_difference
        / demand
    ) * 100 if demand > 0 else 0

    # --------------------------------------------------------
    # PREDICTION STATUS
    # --------------------------------------------------------

    if difference_percentage <= -10:

        prediction_status = (
            "Potentially Overpriced"
        )

    elif difference_percentage >= 10:

        prediction_status = (
            "Potentially Underpriced"
        )

    else:

        prediction_status = (
            "Fair Market Price"
        )

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {

        "plot_id": plot.id,

        "plot_number": plot.plot_number,

        "prediction_available": True,

        "predicted_market_price": round(
            predicted_market_price,
            2
        ),

        "price_per_sqft": round(
            current_ppsf,
            2
        ),

        "current_demand_price": demand,

        "price_difference": round(
            price_difference,
            2
        ),

        "difference_percentage": round(
            difference_percentage,
            2
        ),

        "prediction_status": (
            prediction_status
        ),

        "comparable_plots": len(
            comparable_plots
        ),

        "adjustment_percentage": 0,

        "method": (
            "Comparable Market Analysis"
        ),

        "message": None
    }
@app.get("/plots/societies")
def get_societies():
    try:
        rows = db.execute(
            text("""
                SELECT DISTINCT society
                FROM plots
                WHERE society IS NOT NULL
                ORDER BY society
            """)
        ).fetchall()

        return [
            row[0]
            for row in rows
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load societies: {str(e)}"
        )


@app.get("/plots/map")
def get_plots_for_map(
    society: str | None = None
):
    try:
        if society:
            rows = db.execute(
                text("""
                    SELECT
                        id,
                        society,
                        phase,
                        block,
                        plot_number,
                        size_sqft,
                        facing,
                        is_corner,
                        demand_price,
                        expected_deal_price,
                        ST_Y(location) AS latitude,
                        ST_X(location) AS longitude
                    FROM plots
                    WHERE society = :society
                    ORDER BY id
                """),
                {
                    "society": society
                }
            ).mappings().all()

        else:
            rows = db.execute(
                text("""
                    SELECT
                        id,
                        society,
                        phase,
                        block,
                        plot_number,
                        size_sqft,
                        facing,
                        is_corner,
                        demand_price,
                        expected_deal_price,
                        ST_Y(location) AS latitude,
                        ST_X(location) AS longitude
                    FROM plots
                    ORDER BY id
                """)
            ).mappings().all()

        return [
            {
                "plot_id": row["id"],
                "society": row["society"],
                "phase": row["phase"],
                "block": row["block"],
                "plot_number": row["plot_number"],
                "size_sqft": row["size_sqft"],
                "facing": row["facing"],
                "is_corner": row["is_corner"],
                "demand_price": row["demand_price"],
                "expected_deal_price": row[
                    "expected_deal_price"
                ],
                "latitude": float(row["latitude"])
                if row["latitude"] is not None
                else None,
                "longitude": float(row["longitude"])
                if row["longitude"] is not None
                else None,
            }
            for row in rows
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load map properties: {str(e)}"
        )