import {
  X,
  MapPin,
  Building2,
  Ruler,
  Compass,
  CornerDownRight,
  CircleDollarSign,
  TrendingUp,
  Percent,
  User,
  BarChart3,
  Target,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from "lucide-react";

function formatMillion(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  return `PKR ${(number / 1000000).toFixed(2)}M`;
}

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  return number.toLocaleString();
}

function getRecommendationClass(value) {
  if (!value) {
    return "neutral";
  }

  const text = value.toLowerCase();

  if (
    text.includes("excellent") ||
    text.includes("highly recommended")
  ) {
    return "excellent";
  }

  if (
    text.includes("good") ||
    text.includes("recommended")
  ) {
    return "good";
  }

  if (
    text.includes("moderate") ||
    text.includes("option")
  ) {
    return "moderate";
  }

  if (
    text.includes("low") ||
    text.includes("carefully")
  ) {
    return "low";
  }

  return "neutral";
}

function getPredictionClass(status) {
  if (!status) {
    return "neutral";
  }

  const value = status.toLowerCase();

  if (value.includes("underpriced")) {
    return "positive";
  }

  if (value.includes("overpriced")) {
    return "negative";
  }

  if (value.includes("fair")) {
    return "neutral";
  }

  return "neutral";
}

function getMediaUrl(value) {
  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const baseUrl =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  return `${baseUrl.replace(/\/$/, "")}/${value.replace(
    /^\//,
    ""
  )}`;
}

function PropertyDetailsModal({
  plot,
  investmentData,
  predictionData,
  loadingAnalysis,
  onClose,
  onOpenMap,
}) {
  if (!plot) {
    return null;
  }

  const demand = Number(plot.demand_price || 0);

  const deal = Number(
    plot.expected_deal_price || 0
  );

  const calculatedDiscount =
    demand > 0 && deal > 0
      ? ((demand - deal) / demand) * 100
      : null;

  const discount =
    investmentData?.metrics?.discount_percentage ??
    calculatedDiscount;

  const calculatedPricePerSqft =
    plot.size_sqft && demand > 0
      ? demand / Number(plot.size_sqft)
      : null;

  const pricePerSqft =
    predictionData?.price_per_sqft ??
    calculatedPricePerSqft;

  const images = Array.isArray(plot.images)
    ? plot.images.filter(Boolean)
    : [];

  const documents = Array.isArray(plot.documents)
    ? plot.documents.filter(Boolean)
    : [];

  const latitude =
    plot.latitude !== null &&
    plot.latitude !== undefined
      ? Number(plot.latitude)
      : null;

  const longitude =
    plot.longitude !== null &&
    plot.longitude !== undefined
      ? Number(plot.longitude)
      : null;

  const hasLocation =
    latitude !== null &&
    longitude !== null &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  return (
    <div
      className="property-details-overlay"
      onClick={onClose}
    >
      <div
        className="property-details-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="details-modal-header">
          <div>
            <div className="details-modal-eyebrow">
              PROPERTY INTELLIGENCE
            </div>

            <h2>
              Plot {plot.plot_number}
            </h2>

            <div className="details-location">
              <MapPin size={15} />

              <span>
                {plot.society || "Unknown Society"}

                {plot.phase &&
                  ` • ${plot.phase}`}

                {plot.block &&
                  ` • ${plot.block}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="details-modal-close"
            onClick={onClose}
            aria-label="Close property details"
          >
            <X size={20} />
          </button>
        </div>

        {/* PROPERTY SUMMARY */}

        <div className="details-summary-grid">

          <div className="details-summary-card">
            <span>DEMAND PRICE</span>

            <strong>
              {formatMillion(
                plot.demand_price
              )}
            </strong>

            <CircleDollarSign size={18} />
          </div>

          <div className="details-summary-card">
            <span>EXPECTED DEAL</span>

            <strong>
              {formatMillion(
                plot.expected_deal_price
              )}
            </strong>

            <TrendingUp size={18} />
          </div>

          <div className="details-summary-card">
            <span>PRICE / SQFT</span>

            <strong>
              {pricePerSqft !== null
                ? `PKR ${formatNumber(
                    Math.round(pricePerSqft)
                  )}`
                : "N/A"}
            </strong>

            <BarChart3 size={18} />
          </div>

          <div className="details-summary-card">
            <span>DISCOUNT</span>

            <strong>
              {discount !== null
                ? `${Number(discount).toFixed(2)}%`
                : "N/A"}
            </strong>

            <Percent size={18} />
          </div>

        </div>

        {/* PROPERTY INFORMATION */}

        <section className="details-section">

          <div className="details-section-title">
            <Building2 size={18} />

            <div>
              <span>PROPERTY INFORMATION</span>
              <h3>Plot specifications</h3>
            </div>
          </div>

          <div className="details-info-grid">

            <div className="details-info-item">
              <Ruler size={17} />

              <div>
                <span>Plot Size</span>

                <strong>
                  {plot.size_sqft
                    ? `${formatNumber(
                        plot.size_sqft
                      )} sqft`
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div className="details-info-item">
              <Ruler size={17} />

              <div>
                <span>Width</span>

                <strong>
                  {plot.width_ft !== null &&
                  plot.width_ft !== undefined
                    ? `${formatNumber(
                        plot.width_ft
                      )} ft`
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div className="details-info-item">
              <Ruler size={17} />

              <div>
                <span>Length</span>

                <strong>
                  {plot.length_ft !== null &&
                  plot.length_ft !== undefined
                    ? `${formatNumber(
                        plot.length_ft
                      )} ft`
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div className="details-info-item">
              <Compass size={17} />

              <div>
                <span>Facing</span>

                <strong>
                  {plot.facing || "N/A"}
                </strong>
              </div>
            </div>

            <div className="details-info-item">
              <CornerDownRight size={17} />

              <div>
                <span>Plot Type</span>

                <strong>
                  {plot.is_corner
                    ? "Corner Plot"
                    : "Non-Corner Plot"}
                </strong>
              </div>
            </div>

            <div className="details-info-item">
              <User size={17} />

              <div>
                <span>Owner</span>

                <strong>
                  {plot.owner_name || "Not Available"}
                </strong>
              </div>
            </div>

          </div>
        </section>

        {/* AI MATCH */}

        <section className="details-section">

          <div className="details-section-title">
            <Target size={18} />

            <div>
              <span>AI RECOMMENDATION</span>
              <h3>Why this property matches</h3>
            </div>
          </div>

          <div className="ai-match-panel">

            <div className="ai-score-large">
              <span>AI MATCH SCORE</span>

              <strong>
                {plot.match_score ?? 0}
              </strong>

              <small>/100</small>
            </div>

            <div className="ai-recommendation-content">

              <span
                className={`analysis-badge ${getRecommendationClass(
                  plot.recommendation
                )}`}
              >
                {plot.recommendation ||
                  "Property"}
              </span>

              <p>
                This score is based on the
                property requirements interpreted
                from your search.
              </p>

            </div>

          </div>

          {plot.reasons?.length > 0 && (
            <div className="details-reasons">

              {plot.reasons.map(
                (reason, index) => (
                  <div
                    className="details-reason"
                    key={index}
                  >
                    <CheckCircle2 size={15} />

                    <span>{reason}</span>
                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* INVESTMENT ANALYSIS */}

        <section className="details-section">

          <div className="details-section-title">
            <Activity size={18} />

            <div>
              <span>INVESTMENT INTELLIGENCE</span>
              <h3>Investment analysis</h3>
            </div>
          </div>

          {loadingAnalysis ? (
            <div className="analysis-loading">
              <div className="analysis-spinner"></div>

              <span>
                Calculating investment intelligence...
              </span>
            </div>
          ) : investmentData ? (
            <>
              <div className="investment-score-panel">

                <div className="investment-score-circle">

                  <strong>
                    {investmentData.investment_score ??
                      0}
                  </strong>

                  <span>/100</span>

                </div>

                <div>

                  <span className="analysis-label">
                    INVESTMENT RATING
                  </span>

                  <h4>
                    {investmentData.recommendation ||
                      "Investment Analysis"}
                  </h4>

                  <p>
                    Based on deal potential,
                    plot size, corner status and
                    dimensions.
                  </p>

                </div>

              </div>

              {investmentData.factors && (
                <div className="investment-factors">

                  <div>
                    <span>Deal Potential</span>

                    <strong>
                      {investmentData.factors
                        .deal_potential ?? 0}
                      /40
                    </strong>
                  </div>

                  <div>
                    <span>Plot Size</span>

                    <strong>
                      {investmentData.factors
                        .plot_size ?? 0}
                      /30
                    </strong>
                  </div>

                  <div>
                    <span>Corner Plot</span>

                    <strong>
                      {investmentData.factors
                        .corner_plot ?? 0}
                      /15
                    </strong>
                  </div>

                  <div>
                    <span>Dimensions</span>

                    <strong>
                      {investmentData.factors
                        .dimensions ?? 0}
                      /15
                    </strong>
                  </div>

                </div>
              )}
            </>
          ) : (
            <div className="analysis-unavailable">
              <AlertTriangle size={17} />

              <span>
                Investment analysis is currently
                unavailable.
              </span>
            </div>
          )}

        </section>

        {/* PRICE PREDICTION */}

        <section className="details-section">

          <div className="details-section-title">
            <TrendingUp size={18} />

            <div>
              <span>MARKET INTELLIGENCE</span>
              <h3>Price prediction</h3>
            </div>
          </div>

          {loadingAnalysis ? (
            <div className="analysis-loading">
              <div className="analysis-spinner"></div>

              <span>
                Comparing market prices...
              </span>
            </div>
          ) : predictionData ? (
            <>

              <div className="prediction-grid">

                <div>
                  <span>Current Demand</span>

                  <strong>
                    {formatMillion(
                      predictionData.current_demand_price
                    )}
                  </strong>
                </div>

                <div>
                  <span>Predicted Market</span>

                  <strong>
                    {formatMillion(
                      predictionData.predicted_market_price
                    )}
                  </strong>
                </div>

                <div>
                  <span>Price Difference</span>

                  <strong>
                    {formatMillion(
                      predictionData.price_difference
                    )}
                  </strong>
                </div>

                <div>
                  <span>Comparable Plots</span>

                  <strong>
                    {predictionData.comparable_plots ??
                      0}
                  </strong>
                </div>

              </div>

              <div className="prediction-status">

                <span
                  className={`prediction-badge ${getPredictionClass(
                    predictionData.prediction_status
                  )}`}
                >
                  {predictionData.prediction_status ||
                    "Market Analysis"}
                </span>

                {predictionData.difference_percentage !==
                  null &&
                  predictionData.difference_percentage !==
                    undefined && (
                    <span>
                      {Number(
                        predictionData.difference_percentage
                      ).toFixed(2)}
                      % difference from predicted market
                    </span>
                  )}

              </div>

              {predictionData.message && (
                <p className="prediction-message">
                  {predictionData.message}
                </p>
              )}

            </>
          ) : (
            <div className="analysis-unavailable">
              <AlertTriangle size={17} />

              <span>
                Price prediction is currently
                unavailable.
              </span>
            </div>
          )}

        </section>

        {/* IMAGES */}

        <section className="details-section">

          <div className="details-section-title">
            <ImageIcon size={18} />

            <div>
              <span>PROPERTY MEDIA</span>
              <h3>Property images</h3>
            </div>
          </div>

          {images.length > 0 ? (
            <div className="property-images-grid">

              {images.map(
                (image, index) => (
                  <a
                    href={getMediaUrl(image)}
                    target="_blank"
                    rel="noreferrer"
                    key={`${image}-${index}`}
                  >
                    <img
                      src={getMediaUrl(image)}
                      alt={`Plot ${plot.plot_number} ${
                        index + 1
                      }`}
                    />
                  </a>
                )
              )}

            </div>
          ) : (
            <div className="media-empty">
              <ImageIcon size={20} />

              <span>
                No property images available.
              </span>
            </div>
          )}

        </section>

        {/* DOCUMENTS */}

        <section className="details-section">

          <div className="details-section-title">
            <FileText size={18} />

            <div>
              <span>DOCUMENT MANAGEMENT</span>
              <h3>Property documents</h3>
            </div>
          </div>

          {documents.length > 0 ? (
            <div className="property-documents">

              {documents.map(
                (document, index) => (
                  <a
                    href={getMediaUrl(document)}
                    target="_blank"
                    rel="noreferrer"
                    key={`${document}-${index}`}
                    className="document-link"
                  >
                    <FileText size={17} />

                    <span>
                      Document {index + 1}
                    </span>

                    <ExternalLink
                      size={14}
                    />
                  </a>
                )
              )}

            </div>
          ) : (
            <div className="media-empty">
              <FileText size={20} />

              <span>
                No property documents available.
              </span>
            </div>
          )}

        </section>

        {/* LOCATION */}

        <section className="details-section">

          <div className="details-section-title">
            <MapPin size={18} />

            <div>
              <span>GPS INTELLIGENCE</span>
              <h3>Property location</h3>
            </div>
          </div>

          {hasLocation ? (
            <div className="property-map-panel">

              <div className="coordinates-large">

                <MapPin size={18} />

                <div>
                  <span>GPS COORDINATES</span>

                  <strong>
                    {latitude.toFixed(6)},{" "}
                    {longitude.toFixed(6)}
                  </strong>
                </div>

              </div>

              <button
                type="button"
                className="open-map-button"
                onClick={() =>
                  onOpenMap?.(plot)
                }
              >
                <MapPin size={17} />

                Open in Google Maps

                <ExternalLink size={15} />
              </button>

            </div>
          ) : (
            <div className="media-empty">
              <MapPin size={20} />

              <span>
                GPS location is not available.
              </span>
            </div>
          )}

        </section>

        {/* FOOTER */}

        <div className="details-modal-footer">

          <ShieldCheck size={17} />

          <span>
            Property intelligence is generated
            from available database and market
            information. Investment analysis should
            be verified before making financial
            decisions.
          </span>

        </div>

      </div>
    </div>
  );
}

export default PropertyDetailsModal;