from decimal import Decimal
from typing import Any


def calculate_investment_score(plot) -> dict[str, Any]:
    """
    Calculate an explainable heuristic investment score.

    Maximum score = 100

    Weighting:
        Deal potential   = 40 points
        Plot size        = 30 points
        Corner plot      = 15 points
        Dimensions       = 15 points

    This is a rule-based intelligence score, not a trained ML model.
    """

    # --------------------------------------------------------
    # Convert Decimal values safely
    # --------------------------------------------------------

    demand_price = (
        float(plot.demand_price)
        if plot.demand_price is not None
        else None
    )

    expected_deal_price = (
        float(plot.expected_deal_price)
        if plot.expected_deal_price is not None
        else None
    )

    size_sqft = (
        float(plot.size_sqft)
        if plot.size_sqft is not None
        else None
    )

    width_ft = (
        float(plot.width_ft)
        if plot.width_ft is not None
        else None
    )

    length_ft = (
        float(plot.length_ft)
        if plot.length_ft is not None
        else None
    )

    # --------------------------------------------------------
    # 1. DEAL POTENTIAL — 40 POINTS
    # --------------------------------------------------------

    deal_score = 0.0
    discount_percentage = 0.0

    if (
        demand_price is not None
        and expected_deal_price is not None
        and demand_price > 0
    ):
        discount_percentage = (
            (demand_price - expected_deal_price)
            / demand_price
        ) * 100

        # Negative discount means expected deal price
        # is higher than demand price.
        discount_percentage = max(
            0.0,
            discount_percentage
        )

        # Every 1% discount contributes 4 points.
        # Maximum = 40 points at 10% discount.
        deal_score = min(
            discount_percentage * 4,
            40
        )

    # --------------------------------------------------------
    # 2. PLOT SIZE — 30 POINTS
    # --------------------------------------------------------

    size_score = 0.0

    if size_sqft is not None and size_sqft > 0:
        # 5000 sqft or more receives full 30 points.
        size_score = min(
            (size_sqft / 5000) * 30,
            30
        )

    # --------------------------------------------------------
    # 3. CORNER PLOT — 15 POINTS
    # --------------------------------------------------------

    corner_score = 15.0 if plot.is_corner else 0.0

    # --------------------------------------------------------
    # 4. DIMENSIONS — 15 POINTS
    # --------------------------------------------------------

    dimension_score = 0.0

    if width_ft is not None and width_ft >= 50:
        dimension_score += 7.5

    if length_ft is not None and length_ft >= 100:
        dimension_score += 7.5

    # --------------------------------------------------------
    # FINAL SCORE
    # --------------------------------------------------------

    total_score = (
        deal_score
        + size_score
        + corner_score
        + dimension_score
    )

    total_score = min(
        round(total_score, 2),
        100
    )

    # --------------------------------------------------------
    # RECOMMENDATION
    # --------------------------------------------------------

    if total_score >= 80:
        recommendation = "Strong Investment"

    elif total_score >= 65:
        recommendation = "Good Investment"

    elif total_score >= 50:
        recommendation = "Moderate Investment"

    elif total_score >= 35:
        recommendation = "Low Investment Potential"

    else:
        recommendation = "Weak Investment"

    # --------------------------------------------------------
    # RETURN EXPLAINABLE RESULT
    # --------------------------------------------------------

    return {
        "investment_score": total_score,
        "recommendation": recommendation,

        "factors": {
            "deal_potential": round(
                deal_score,
                2
            ),

            "plot_size": round(
                size_score,
                2
            ),

            "corner_plot": round(
                corner_score,
                2
            ),

            "dimensions": round(
                dimension_score,
                2
            )
        },

        "metrics": {
            "demand_price": demand_price,

            "expected_deal_price": (
                expected_deal_price
            ),

            "discount_percentage": round(
                discount_percentage,
                2
            ),

            "size_sqft": size_sqft,

            "width_ft": width_ft,

            "length_ft": length_ft,

            "is_corner": bool(
                plot.is_corner
            )
        }
    }