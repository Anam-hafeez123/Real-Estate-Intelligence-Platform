from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any


# ============================================================
# BASE CONFIG
# ============================================================

class ORMBaseModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# PLOT CREATE
# ============================================================

class PlotCreate(BaseModel):
    society: str
    phase: Optional[str] = None
    block: Optional[str] = None
    plot_number: Optional[str] = None

    size_sqft: Optional[float] = None
    width_ft: Optional[float] = None
    length_ft: Optional[float] = None

    demand_price: Optional[float] = None
    expected_deal_price: Optional[float] = None

    facing: Optional[str] = None
    is_corner: bool = False

    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ============================================================
# PLOT UPDATE
# ============================================================

class PlotUpdate(BaseModel):
    society: Optional[str] = None
    phase: Optional[str] = None
    block: Optional[str] = None
    plot_number: Optional[str] = None

    size_sqft: Optional[float] = None
    width_ft: Optional[float] = None
    length_ft: Optional[float] = None

    demand_price: Optional[float] = None
    expected_deal_price: Optional[float] = None

    facing: Optional[str] = None
    is_corner: Optional[bool] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ============================================================
# PLOT RESPONSE
# ============================================================

class PlotResponse(ORMBaseModel):
    id: int

    society: str
    phase: Optional[str] = None
    block: Optional[str] = None
    plot_number: Optional[str] = None

    size_sqft: Optional[float] = None
    width_ft: Optional[float] = None
    length_ft: Optional[float] = None

    demand_price: Optional[float] = None
    expected_deal_price: Optional[float] = None

    facing: Optional[str] = None
    is_corner: bool = False

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    distance_km: Optional[float] = None


# ============================================================
# RECOMMENDATION RESPONSE
# ============================================================

class RecommendationResponse(BaseModel):
    plot_id: int
    plot_number: Optional[str] = None
    society: Optional[str] = None

    match_score: float
    recommendation: str

    reasons: List[str]

    demand_price: Optional[float] = None
    expected_deal_price: Optional[float] = None

    size_sqft: Optional[float] = None

    facing: Optional[str] = None
    is_corner: bool = False

    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ============================================================
# INVESTMENT SCORE
# ============================================================

class InvestmentFactors(BaseModel):
    deal_potential: float
    plot_size: float
    corner_plot: float
    dimensions: float


class InvestmentMetrics(BaseModel):
    demand_price: float
    expected_deal_price: float

    discount_percentage: float

    size_sqft: float
    width_ft: float
    length_ft: float

    is_corner: bool


class InvestmentScoreResponse(BaseModel):
    plot_id: int
    plot_number: Optional[str] = None
    society: Optional[str] = None

    investment_score: float
    recommendation: str

    factors: InvestmentFactors
    metrics: InvestmentMetrics


# ============================================================
# MARKET OVERVIEW
# ============================================================

class MarketOverviewResponse(BaseModel):
    total_plots: int

    average_demand_price: Optional[float] = None
    average_expected_deal_price: Optional[float] = None

    minimum_demand_price: Optional[float] = None
    maximum_demand_price: Optional[float] = None

    average_price_per_sqft: Optional[float] = None
    average_discount_percentage: Optional[float] = None

    corner_plots: int
    non_corner_plots: int


# ============================================================
# SOCIETY MARKET ANALYSIS
# ============================================================

class SocietyMarketResponse(BaseModel):
    society: Optional[str] = None

    total_plots: int

    average_demand_price: Optional[float] = None
    average_expected_deal_price: Optional[float] = None

    average_price_per_sqft: Optional[float] = None


# ============================================================
# PRICE PER SQFT
# ============================================================

class PricePerSqftResponse(BaseModel):
    plot_id: int
    plot_number: Optional[str] = None
    society: Optional[str] = None

    size_sqft: float
    demand_price: float
    price_per_sqft: float


# ============================================================
# PRICE PREDICTION
# ============================================================

class PricePredictionResponse(BaseModel):
    plot_id: int
    plot_number: Optional[str] = None

    prediction_available: bool

    predicted_market_price: Optional[float] = None

    price_per_sqft: Optional[float] = None

    current_demand_price: Optional[float] = None

    price_difference: Optional[float] = None
    difference_percentage: Optional[float] = None

    prediction_status: str

    comparable_plots: int

    adjustment_percentage: Optional[float] = None

    method: str

    message: Optional[str] = None


# ============================================================
# AI PROPERTY ASSISTANT REQUEST
# ============================================================

class PropertyAssistantRequest(BaseModel):
    query: str


# ============================================================
# AI PROPERTY ASSISTANT RESPONSE
# ============================================================

class PropertyAssistantResponse(BaseModel):
    query: str
    intent: str

    message: str

    interpreted_filters: Dict[str, Any]

    plots: List[RecommendationResponse]

    total_results: int