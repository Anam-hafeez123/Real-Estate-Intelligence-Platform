import { useEffect, useState } from "react";

import {
  Search,
  Building2,
  CircleDollarSign,
  TrendingUp,
  Percent,
  MapPin,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  CornerDownRight,
  Ruler,
  Compass,
  X,
  ExternalLink,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

import api from "./services/api";
import "./App.css";
import "./searchresults.css";

function formatMillion(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  return `PKR ${(number / 1000000).toFixed(2)}M`;
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  return number.toLocaleString();
}

function getRecommendationClass(recommendation) {
  if (!recommendation) {
    return "neutral";
  }

  const value = String(recommendation).toLowerCase();

  if (
    value.includes("recommended") ||
    value.includes("excellent") ||
    value.includes("strong")
  ) {
    return "recommended";
  }

  if (
    value.includes("carefully") ||
    value.includes("caution") ||
    value.includes("consider")
  ) {
    return "careful";
  }

  return "neutral";
}

function App() {
  const [marketData, setMarketData] = useState(null);

  const [assistantQuery, setAssistantQuery] = useState("");

  const [assistantResults, setAssistantResults] = useState(null);

  const [selectedPlot, setSelectedPlot] = useState(null);

  const [loadingMarket, setLoadingMarket] = useState(true);

  const [loadingAssistant, setLoadingAssistant] = useState(false);

  const [marketError, setMarketError] = useState("");

  const [assistantError, setAssistantError] = useState("");

  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    loadMarketOverview();
  }, []);

  async function loadMarketOverview() {
    try {
      setLoadingMarket(true);
      setMarketError("");

      const response = await api.get("/market/overview");

      setMarketData(response.data);
      setApiConnected(true);
    } catch (error) {
      console.error("Market overview error:", error);

      setApiConnected(false);

      setMarketError(
        error.response?.data?.detail ||
          "Unable to connect to the property intelligence API."
      );
    } finally {
      setLoadingMarket(false);
    }
  }

  async function handleAssistantSearch(query = assistantQuery) {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery || loadingAssistant) {
      return;
    }

    try {
      setLoadingAssistant(true);
      setAssistantError("");

      const response = await api.post("/assistant/search", {
        query: cleanQuery,
      });

      setAssistantResults(response.data);

      setApiConnected(true);

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (error) {
      console.error("Assistant search error:", error);

      setAssistantError(
        error.response?.data?.detail ||
          "Unable to process your property search."
      );

      setAssistantResults(null);
    } finally {
      setLoadingAssistant(false);
    }
  }

  function handleQuickSearch(query) {
    setAssistantQuery(query);
    handleAssistantSearch(query);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAssistantSearch();
    }
  }

  function openMap(plot) {
    const latitude = plot?.latitude;
    const longitude = plot?.longitude;

    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return;
    }

    const url =
      "https://www.google.com/maps/search/?api=1&query=" +
      `${latitude},${longitude}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function renderPropertyCard(plot) {
    const plotId = plot.plot_id ?? plot.id ?? plot.plot_number;

    return (
      <article className="property-card" key={plotId}>
        <div className="property-card-top">
          <div>
            <div className="property-number">
              Plot {plot.plot_number ?? "N/A"}
            </div>

            <div className="property-society">
              <MapPin size={14} />
              <span>{plot.society || "Unknown Society"}</span>
            </div>
          </div>

          <div className="score-wrapper">
            <span>AI SCORE</span>

            <div className="score-badge">
              {plot.match_score ?? 0}
            </div>
          </div>
        </div>

        <div className="property-price">
          <div>
            <span>Demand price</span>

            <strong>
              {formatMillion(plot.demand_price)}
            </strong>
          </div>

          <div className="deal-price">
            <span>Expected deal</span>

            <strong>
              {formatMillion(plot.expected_deal_price)}
            </strong>
          </div>
        </div>

        <div className="property-details">
          <div className="detail">
            <span>
              <Ruler size={13} />
              Size
            </span>

            <strong>
              {formatNumber(plot.size_sqft)} sqft
            </strong>
          </div>

          <div className="detail">
            <span>
              <Compass size={13} />
              Facing
            </span>

            <strong>{plot.facing || "N/A"}</strong>
          </div>

          <div className="detail">
            <span>Width</span>

            <strong>
              {plot.width_ft !== null &&
              plot.width_ft !== undefined
                ? `${formatNumber(plot.width_ft)} ft`
                : "N/A"}
            </strong>
          </div>

          <div className="detail">
            <span>Length</span>

            <strong>
              {plot.length_ft !== null &&
              plot.length_ft !== undefined
                ? `${formatNumber(plot.length_ft)} ft`
                : "N/A"}
            </strong>
          </div>
        </div>

        <div className="property-tags">
          {plot.is_corner && (
            <span className="corner-tag">
              <CornerDownRight size={13} />
              Corner plot
            </span>
          )}

          {plot.recommendation && (
            <span
              className={`recommendation-tag ${getRecommendationClass(
                plot.recommendation
              )}`}
            >
              {plot.recommendation}
            </span>
          )}
        </div>

        {Array.isArray(plot.reasons) && plot.reasons.length > 0 && (
          <div className="reasons">
            <div className="reasons-title">
              Why AI selected it
            </div>

            {plot.reasons.map((reason, index) => (
              <div
                className="reason"
                key={`${plotId}-reason-${index}`}
              >
                <span className="reason-dot"></span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {plot.latitude !== null &&
          plot.latitude !== undefined &&
          plot.longitude !== null &&
          plot.longitude !== undefined && (
            <div className="coordinates">
              <MapPin size={13} />

              <span>
                {Number(plot.latitude).toFixed(4)},{" "}
                {Number(plot.longitude).toFixed(4)}
              </span>

              <button
                type="button"
                onClick={() => openMap(plot)}
              >
                <ExternalLink size={13} />
                Map
              </button>
            </div>
          )}

        <button
          className="view-property-button"
          type="button"
          onClick={() => setSelectedPlot(plot)}
        >
          View property details
          <ArrowRight size={15} />
        </button>
      </article>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">
              <Building2 size={21} strokeWidth={2.2} />
            </div>

            <div>
              <div className="brand-name">
                Real Estate Intelligence
              </div>

              <div className="brand-subtitle">
                Property analytics platform
              </div>
            </div>
          </div>

          <div
            className={
              apiConnected
                ? "header-status connected"
                : "header-status disconnected"
            }
          >
            <span className="status-dot"></span>

            {apiConnected
              ? "API Connected"
              : "API Connection Error"}
          </div>
        </div>
      </header>

      <main className="main-container">
        <section className="hero-section">
          <div className="hero-content">
            <div className="eyebrow">
              PROPERTY INTELLIGENCE
            </div>

            <h1>
              Find property with
              <span> better intelligence.</span>
            </h1>

            <p className="hero-description">
              Search properties, compare market prices,
              evaluate investments and discover better
              opportunities with AI-powered insights.
            </p>
          </div>

          <div className="hero-badge">
            <div className="hero-ai">AI</div>

            <div className="hero-ai-label">
              Property Assistant
            </div>
          </div>
        </section>

        <section className="assistant-panel">
          <div className="assistant-title">
            <Sparkles size={19} />
            <span>Ask the Property Assistant</span>
          </div>

          <div className="search-row">
            <div className="search-input-wrapper">
              <Search
                className="search-icon"
                size={20}
              />

              <input
                type="text"
                value={assistantQuery}
                onChange={(event) =>
                  setAssistantQuery(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder='Try "Show me plots above 3000 sqft in Lake City"'
              />

              {assistantQuery && (
                <button
                  className="clear-input"
                  type="button"
                  onClick={() => setAssistantQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              className="search-button"
              type="button"
              onClick={() => handleAssistantSearch()}
              disabled={
                loadingAssistant ||
                !assistantQuery.trim()
              }
            >
              {loadingAssistant ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />
                  Searching
                </>
              ) : (
                <>
                  Search
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>

          <div className="quick-searches">
            <button
              type="button"
              onClick={() =>
                handleQuickSearch(
                  "Show me corner plots under 50 million"
                )
              }
            >
              Corner plots under 50 million
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickSearch(
                  "Show me plots above 3000 sqft in Lake City"
                )
              }
            >
              Large plots in Lake City
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickSearch(
                  "Show me properties in DHA Lahore"
                )
              }
            >
              Properties in DHA Lahore
            </button>
          </div>
        </section>

        {marketError && (
          <div className="error-message">
            <AlertCircle size={18} />

            <span>{marketError}</span>

            <button
              type="button"
              onClick={loadMarketOverview}
            >
              Retry
            </button>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Building2 size={21} />
            </div>

            <div className="stat-content">
              <div className="stat-label">
                Total Properties
              </div>

              <div className="stat-value">
                {loadingMarket
                  ? "..."
                  : marketData?.total_plots ?? 0}
              </div>

              <div className="stat-description">
                Available properties
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CircleDollarSign size={21} />
            </div>

            <div className="stat-content">
              <div className="stat-label">
                Average Price
              </div>

              <div className="stat-value stat-small">
                {loadingMarket
                  ? "..."
                  : formatMillion(
                      marketData?.average_demand_price
                    )}
              </div>

              <div className="stat-description">
                Current demand
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={21} />
            </div>

            <div className="stat-content">
              <div className="stat-label">
                Price / Sqft
              </div>

              <div className="stat-value stat-small">
                {loadingMarket
                  ? "..."
                  : marketData?.average_price_per_sqft
                  ? `PKR ${formatNumber(
                      Math.round(
                        Number(
                          marketData.average_price_per_sqft
                        )
                      )
                    )}`
                  : "N/A"}
              </div>

              <div className="stat-description">
                Market average
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-highlight">
            <div className="stat-icon">
              <Percent size={21} />
            </div>

            <div className="stat-content">
              <div className="stat-label">
                Average Discount
              </div>

              <div className="stat-value">
                {loadingMarket
                  ? "..."
                  : marketData?.average_discount_percentage !==
                      null &&
                    marketData?.average_discount_percentage !==
                      undefined
                  ? `${Number(
                      marketData.average_discount_percentage
                    ).toFixed(2)}%`
                  : "N/A"}
              </div>

              <div className="stat-description">
                Negotiation potential
              </div>
            </div>
          </div>
        </section>

        {marketData && !loadingMarket && (
          <section className="market-summary">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  MARKET SNAPSHOT
                </div>

                <h2>Current property market</h2>
              </div>

              <div className="market-live">
                <span></span>
                Live database
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-item">
                <span>Minimum Demand</span>

                <strong>
                  {formatMillion(
                    marketData.minimum_demand_price
                  )}
                </strong>
              </div>

              <div className="summary-item">
                <span>Maximum Demand</span>

                <strong>
                  {formatMillion(
                    marketData.maximum_demand_price
                  )}
                </strong>
              </div>

              <div className="summary-item">
                <span>Corner Plots</span>

                <strong>
                  {marketData.corner_plots ?? 0}
                </strong>
              </div>

              <div className="summary-item">
                <span>Non-Corner Plots</span>

                <strong>
                  {marketData.non_corner_plots ?? 0}
                </strong>
              </div>
            </div>
          </section>
        )}

        {assistantError && (
          <div className="error-message assistant-error">
            <AlertCircle size={18} />
            <span>{assistantError}</span>
          </div>
        )}

        {assistantResults && (
          <section
            className="results-section"
            id="results"
          >
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  AI RECOMMENDATIONS
                </div>

                <h2>
                  Properties worth exploring
                </h2>
              </div>

              <div className="result-count">
                <BarChart3 size={15} />

                {assistantResults.total_results ?? 0}{" "}
                result
                {(assistantResults.total_results ?? 0) !==
                1
                  ? "s"
                  : ""}
              </div>
            </div>

            <div className="assistant-message">
              <Sparkles size={17} />

              <span>
                {assistantResults.message ||
                  "Search completed."}
              </span>
            </div>

            {assistantResults.interpreted_filters &&
              Object.keys(
                assistantResults.interpreted_filters
              ).length > 0 && (
                <div className="interpreted-filters">
                  <div className="filter-title">
                    <CheckCircle2 size={15} />
                    Search interpreted
                  </div>

                  <div className="filter-list">
                    {Object.entries(
                      assistantResults.interpreted_filters
                    ).map(([key, value]) => (
                      <span
                        className="filter-chip"
                        key={key}
                      >
                        {key.replaceAll("_", " ")}:{" "}
                        <strong>
                          {typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : String(value)}
                        </strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {Array.isArray(assistantResults.plots) &&
            assistantResults.plots.length > 0 ? (
              <div className="property-grid">
                {assistantResults.plots.map(
                  renderPropertyCard
                )}
              </div>
            ) : (
              <div className="empty-results">
                <div className="empty-icon">
                  <Search size={28} />
                </div>

                <h3>No matching properties</h3>

                <p>
                  Try changing your budget, plot size,
                  society or other requirements.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickSearch(
                      "Show me properties in DHA Lahore"
                    )
                  }
                >
                  Try another search
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}

        {!assistantResults && !loadingMarket && (
          <section className="recommendation-placeholder">
            <div className="placeholder-icon">
              <Sparkles size={22} />
            </div>

            <div>
              <div className="eyebrow">
                AI RECOMMENDATIONS
              </div>

              <h2>Properties worth exploring</h2>

              <p>
                Use the Property Assistant above to
                find properties based on your
                requirements.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleQuickSearch(
                  "Show me corner plots under 50 million"
                )
              }
            >
              Explore properties
              <ArrowRight size={17} />
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        <div>
          Real Estate Intelligence Platform
        </div>

        <div>
          AI-powered property analysis
        </div>
      </footer>

      {selectedPlot && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedPlot(null)}
        >
          <div
            className="property-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelectedPlot(null)}
            >
              <X size={20} />
            </button>

            <div className="modal-eyebrow">
              PROPERTY DETAILS
            </div>

            <h2>
              Plot {selectedPlot.plot_number ?? "N/A"}
            </h2>

            <p className="modal-location">
              <MapPin size={15} />

              {selectedPlot.society ||
                "Unknown Society"}

              {selectedPlot.phase &&
                ` • ${selectedPlot.phase}`}

              {selectedPlot.block &&
                ` • ${selectedPlot.block}`}
            </p>

            <div className="modal-score">
              <div>
                <span>AI MATCH SCORE</span>

                <strong>
                  {selectedPlot.match_score ?? 0}/100
                </strong>
              </div>

              <span
                className={`recommendation-tag ${getRecommendationClass(
                  selectedPlot.recommendation
                )}`}
              >
                {selectedPlot.recommendation ||
                  "Property"}
              </span>
            </div>

            <div className="modal-grid">
              <div>
                <span>Demand Price</span>

                <strong>
                  {formatMillion(
                    selectedPlot.demand_price
                  )}
                </strong>
              </div>

              <div>
                <span>Expected Deal</span>

                <strong>
                  {formatMillion(
                    selectedPlot.expected_deal_price
                  )}
                </strong>
              </div>

              <div>
                <span>Plot Size</span>

                <strong>
                  {formatNumber(
                    selectedPlot.size_sqft
                  )}{" "}
                  sqft
                </strong>
              </div>

              <div>
                <span>Facing</span>

                <strong>
                  {selectedPlot.facing || "N/A"}
                </strong>
              </div>

              <div>
                <span>Width</span>

                <strong>
                  {selectedPlot.width_ft !== null &&
                  selectedPlot.width_ft !== undefined
                    ? `${formatNumber(
                        selectedPlot.width_ft
                      )} ft`
                    : "N/A"}
                </strong>
              </div>

              <div>
                <span>Length</span>

                <strong>
                  {selectedPlot.length_ft !== null &&
                  selectedPlot.length_ft !== undefined
                    ? `${formatNumber(
                        selectedPlot.length_ft
                      )} ft`
                    : "N/A"}
                </strong>
              </div>
            </div>

            {Array.isArray(selectedPlot.reasons) &&
              selectedPlot.reasons.length > 0 && (
                <div className="modal-reasons">
                  <h3>AI reasoning</h3>

                  {selectedPlot.reasons.map(
                    (reason, index) => (
                      <div
                        className="modal-reason"
                        key={index}
                      >
                        <CheckCircle2 size={15} />
                        <span>{reason}</span>
                      </div>
                    )
                  )}
                </div>
              )}

            {selectedPlot.latitude !== null &&
              selectedPlot.latitude !== undefined &&
              selectedPlot.longitude !== null &&
              selectedPlot.longitude !== undefined && (
                <button
                  className="modal-map-button"
                  type="button"
                  onClick={() =>
                    openMap(selectedPlot)
                  }
                >
                  <MapPin size={17} />
                  Open property location
                  <ExternalLink size={15} />
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;