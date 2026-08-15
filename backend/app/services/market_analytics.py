from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Plot


# ============================================================
# MARKET OVERVIEW
# ============================================================

def get_market_overview(db: Session):

    total_plots = (
        db.query(func.count(Plot.id))
        .scalar()
    ) or 0

    average_demand_price = (
        db.query(func.avg(Plot.demand_price))
        .filter(
            Plot.demand_price.isnot(None)
        )
        .scalar()
    )

    average_deal_price = (
        db.query(func.avg(Plot.expected_deal_price))
        .filter(
            Plot.expected_deal_price.isnot(None)
        )
        .scalar()
    )

    minimum_demand_price = (
        db.query(func.min(Plot.demand_price))
        .filter(
            Plot.demand_price.isnot(None)
        )
        .scalar()
    )

    maximum_demand_price = (
        db.query(func.max(Plot.demand_price))
        .filter(
            Plot.demand_price.isnot(None)
        )
        .scalar()
    )

    corner_plots = (
        db.query(func.count(Plot.id))
        .filter(
            Plot.is_corner == True
        )
        .scalar()
    ) or 0

    non_corner_plots = (
        db.query(func.count(Plot.id))
        .filter(
            Plot.is_corner == False
        )
        .scalar()
    ) or 0

    # Average price per square foot
    average_price_per_sqft = (
        db.query(
            func.avg(
                Plot.demand_price / Plot.size_sqft
            )
        )
        .filter(
            Plot.demand_price.isnot(None)
        )
        .filter(
            Plot.size_sqft.isnot(None)
        )
        .filter(
            Plot.size_sqft > 0
        )
        .scalar()
    )

    # Average discount percentage
    average_discount_percentage = (
        db.query(
            func.avg(
                (
                    (Plot.demand_price - Plot.expected_deal_price)
                    / Plot.demand_price
                ) * 100
            )
        )
        .filter(
            Plot.demand_price.isnot(None)
        )
        .filter(
            Plot.expected_deal_price.isnot(None)
        )
        .filter(
            Plot.demand_price > 0
        )
        .scalar()
    )

    return {
        "total_plots": total_plots,

        "average_demand_price": (
            round(float(average_demand_price), 2)
            if average_demand_price is not None
            else None
        ),

        "average_expected_deal_price": (
            round(float(average_deal_price), 2)
            if average_deal_price is not None
            else None
        ),

        "minimum_demand_price": (
            float(minimum_demand_price)
            if minimum_demand_price is not None
            else None
        ),

        "maximum_demand_price": (
            float(maximum_demand_price)
            if maximum_demand_price is not None
            else None
        ),

        "average_price_per_sqft": (
            round(float(average_price_per_sqft), 2)
            if average_price_per_sqft is not None
            else None
        ),

        "average_discount_percentage": (
            round(float(average_discount_percentage), 2)
            if average_discount_percentage is not None
            else None
        ),

        "corner_plots": corner_plots,

        "non_corner_plots": non_corner_plots
    }


# ============================================================
# SOCIETY MARKET ANALYSIS
# ============================================================

def get_society_market(
    db: Session,
    society: str
):

    total_plots = (
        db.query(func.count(Plot.id))
        .filter(
            Plot.society.ilike(society)
        )
        .scalar()
    ) or 0

    average_demand_price = (
        db.query(func.avg(Plot.demand_price))
        .filter(
            Plot.society.ilike(society)
        )
        .filter(
            Plot.demand_price.isnot(None)
        )
        .scalar()
    )

    average_deal_price = (
        db.query(func.avg(Plot.expected_deal_price))
        .filter(
            Plot.society.ilike(society)
        )
        .filter(
            Plot.expected_deal_price.isnot(None)
        )
        .scalar()
    )

    average_price_per_sqft = (
        db.query(
            func.avg(
                Plot.demand_price / Plot.size_sqft
            )
        )
        .filter(
            Plot.society.ilike(society)
        )
        .filter(
            Plot.demand_price.isnot(None)
        )
        .filter(
            Plot.size_sqft.isnot(None)
        )
        .filter(
            Plot.size_sqft > 0
        )
        .scalar()
    )

    return {
        "society": society,

        "total_plots": total_plots,

        "average_demand_price": (
            round(float(average_demand_price), 2)
            if average_demand_price is not None
            else None
        ),

        "average_expected_deal_price": (
            round(float(average_deal_price), 2)
            if average_deal_price is not None
            else None
        ),

        "average_price_per_sqft": (
            round(float(average_price_per_sqft), 2)
            if average_price_per_sqft is not None
            else None
        )
    }


# ============================================================
# PRICE PER SQUARE FOOT ANALYSIS
# ============================================================

def get_price_per_sqft_analysis(
    db: Session
):

    results = (
        db.query(
            Plot.id,
            Plot.plot_number,
            Plot.society,
            Plot.size_sqft,
            Plot.demand_price,
            (
                Plot.demand_price / Plot.size_sqft
            ).label("price_per_sqft")
        )
        .filter(
            Plot.demand_price.isnot(None)
        )
        .filter(
            Plot.size_sqft.isnot(None)
        )
        .filter(
            Plot.size_sqft > 0
        )
        .order_by(
            (
                Plot.demand_price / Plot.size_sqft
            ).desc()
        )
        .all()
    )

    response = []

    for row in results:

        response.append({
            "plot_id": row.id,
            "plot_number": row.plot_number,
            "society": row.society,

            "size_sqft": (
                float(row.size_sqft)
                if row.size_sqft is not None
                else None
            ),

            "demand_price": (
                float(row.demand_price)
                if row.demand_price is not None
                else None
            ),

            "price_per_sqft": round(
                float(row.price_per_sqft),
                2
            )
        })

    return response