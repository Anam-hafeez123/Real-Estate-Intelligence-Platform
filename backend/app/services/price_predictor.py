from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Plot


def predict_plot_price(
    db: Session,
    plot: Plot
):
    """
    Estimate a plot's market price using comparable plots.

    This is the Phase 10A prediction engine.
    It uses comparable properties rather than pretending
    that a small dataset is a trained ML model.
    """

    if not plot.size_sqft or plot.size_sqft <= 0:
        raise ValueError(
            "Plot size is required for price prediction"
        )

    # --------------------------------------------------------
    # Find comparable plots
    # --------------------------------------------------------

    query = (
        db.query(Plot)
        .filter(
            Plot.id != plot.id
        )
        .filter(
            Plot.size_sqft.isnot(None)
        )
        .filter(
            Plot.size_sqft > 0
        )
        .filter(
            Plot.demand_price.isnot(None)
        )
    )

    # Prefer same society
    if plot.society:
        society_plots = (
            query
            .filter(
                Plot.society.ilike(plot.society)
            )
            .all()
        )

        if society_plots:
            comparable_plots = society_plots
        else:
            comparable_plots = query.all()

    else:
        comparable_plots = query.all()

    # --------------------------------------------------------
    # If no comparable plots exist
    # --------------------------------------------------------

    if not comparable_plots:
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
            "prediction_status": "Insufficient Data",
            "comparable_plots": 0,
            "message": (
                "Not enough comparable plots available "
                "to generate a reliable market prediction."
            )
        }

    # --------------------------------------------------------
    # Calculate comparable price per square foot
    # --------------------------------------------------------

    comparable_prices = []

    for comparable in comparable_plots:

        if (
            comparable.size_sqft
            and comparable.size_sqft > 0
            and comparable.demand_price is not None
        ):

            price_per_sqft = (
                float(comparable.demand_price)
                / float(comparable.size_sqft)
            )

            comparable_prices.append(
                price_per_sqft
            )

    if not comparable_prices:
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
            "prediction_status": "Insufficient Data",
            "comparable_plots": 0,
            "message": (
                "Comparable plots do not contain "
                "enough pricing information."
            )
        }

    # --------------------------------------------------------
    # Median price per sqft
    # --------------------------------------------------------

    comparable_prices.sort()

    middle = len(comparable_prices) // 2

    if len(comparable_prices) % 2 == 0:
        median_price_per_sqft = (
            comparable_prices[middle - 1]
            + comparable_prices[middle]
        ) / 2
    else:
        median_price_per_sqft = comparable_prices[middle]

    # --------------------------------------------------------
    # Base predicted price
    # --------------------------------------------------------

    predicted_price = (
        median_price_per_sqft
        * float(plot.size_sqft)
    )

    # --------------------------------------------------------
    # Feature adjustments
    # --------------------------------------------------------

    adjustment_percentage = 0.0

    # Corner plot premium
    if plot.is_corner:
        adjustment_percentage += 5.0

    # Facing adjustment
    if plot.facing:
        facing = plot.facing.lower()

        if facing in ["main boulevard", "main road"]:
            adjustment_percentage += 3.0

        elif facing == "park":
            adjustment_percentage += 2.0

    # --------------------------------------------------------
    # Apply adjustment
    # --------------------------------------------------------

    predicted_price = predicted_price * (
        1 + adjustment_percentage / 100
    )

    # --------------------------------------------------------
    # Compare with current demand price
    # --------------------------------------------------------

    current_demand_price = (
        float(plot.demand_price)
        if plot.demand_price is not None
        else None
    )

    price_difference = None
    difference_percentage = None
    prediction_status = "No Current Price"

    if current_demand_price is not None:

        price_difference = (
            predicted_price
            - current_demand_price
        )

        if current_demand_price > 0:

            difference_percentage = (
                price_difference
                / current_demand_price
            ) * 100

            if difference_percentage >= 10:
                prediction_status = "Underpriced Opportunity"

            elif difference_percentage >= 3:
                prediction_status = "Potentially Undervalued"

            elif difference_percentage > -3:
                prediction_status = "Fairly Priced"

            elif difference_percentage > -10:
                prediction_status = "Potentially Overpriced"

            else:
                prediction_status = "Overpriced"

    # --------------------------------------------------------
    # Return prediction
    # --------------------------------------------------------

    return {
        "plot_id": plot.id,
        "plot_number": plot.plot_number,

        "prediction_available": True,

        "predicted_market_price": round(
            predicted_price,
            2
        ),

        "price_per_sqft": round(
            median_price_per_sqft,
            2
        ),

        "current_demand_price": current_demand_price,

        "price_difference": (
            round(
                price_difference,
                2
            )
            if price_difference is not None
            else None
        ),

        "difference_percentage": (
            round(
                difference_percentage,
                2
            )
            if difference_percentage is not None
            else None
        ),

        "prediction_status": prediction_status,

        "comparable_plots": len(
            comparable_prices
        ),

        "adjustment_percentage": round(
            adjustment_percentage,
            2
        ),

        "method": (
            "Comparable Market Analysis"
        )
    }