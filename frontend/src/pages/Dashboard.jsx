import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  TrendingUp,
  Building2,
  CircleDollarSign,
} from "lucide-react";

import {
  getMarketOverview,
  getRecommendations,
  searchAssistant,
} from "../services/api";

function Dashboard() {
  const [market, setMarket] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [query, setQuery] = useState("");
  const [assistantResults, setAssistantResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [marketData, recommendationData] =
        await Promise.all([
          getMarketOverview(),
          getRecommendations(),
        ]);

      setMarket(marketData);
      setRecommendations(
        recommendationData.slice(0, 5)
      );
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      setLoading(true);

      const data = await searchAssistant(query);

      setAssistantResults(data);
    } catch (error) {
      console.error(
        "Assistant search error:",
        error
      );

      alert(
        "Unable to connect to the Real Estate API."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard">

      {/* HERO */}

      <section className="hero">

        <div className="hero-content">

          <div className="eyebrow">
            PROPERTY INTELLIGENCE
          </div>

          <h1>
            Find property with
            <span> better intelligence.</span>
          </h1>

          <p>
            Search properties, compare market prices,
            evaluate investments and discover better
            opportunities with AI-powered insights.
          </p>

        </div>

        <div className="ai-badge">
          <strong>AI</strong>
          <span>Property Assistant</span>
        </div>

      </section>

      {/* AI SEARCH */}

      <section className="assistant">

        <div className="assistant-title">
          Ask the Property Assistant
        </div>

        <div className="search-container">

          <Search size={21} />

          <input
            type="text"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder='Try "Show me plots above 3000 sqft in Lake City"'
          />

          <button
            onClick={handleSearch}
            disabled={loading}
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>

        </div>

        <div className="quick-searches">

          <button
            onClick={() =>
              setQuery(
                "Show me corner plots under 50 million"
              )
            }
          >
            Corner plots under 50 million
          </button>

          <button
            onClick={() =>
              setQuery(
                "Show me plots above 3000 sqft in Lake City"
              )
            }
          >
            Large plots in Lake City
          </button>

          <button
            onClick={() =>
              setQuery(
                "Show me plots in DHA Lahore"
              )
            }
          >
            Properties in DHA Lahore
          </button>

        </div>

      </section>

      {/* MARKET STATISTICS */}

      <section className="stats">

        <div className="stat-card">

          <div className="stat-icon">
            <Building2 size={20} />
          </div>

          <div>
            <span>Total Properties</span>

            <strong>
              {market?.total_plots ?? "..."}
            </strong>

            <small>
              Available properties
            </small>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <CircleDollarSign size={20} />
          </div>

          <div>
            <span>Average Price</span>

            <strong>
              {market?.average_demand_price
                ? `PKR ${(market.average_demand_price / 1000000).toFixed(1)}M`
                : "..."}
            </strong>

            <small>
              Current demand
            </small>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Price / Sqft</span>

            <strong>
              {market?.average_price_per_sqft
                ? `PKR ${market.average_price_per_sqft.toLocaleString()}`
                : "..."}
            </strong>

            <small>
              Market average
            </small>
          </div>

        </div>

        <div className="stat-card highlight">

          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Average Discount</span>

            <strong>
              {market?.average_discount_percentage !==
                null &&
              market?.average_discount_percentage !==
                undefined
                ? `${market.average_discount_percentage.toFixed(
                    1
                  )}%`
                : "..."}
            </strong>

            <small>
              Negotiation potential
            </small>
          </div>

        </div>

      </section>

      {/* AI SEARCH RESULTS */}

      {assistantResults && (

        <section className="results-panel">

          <div className="panel-heading">

            <div>

              <div className="eyebrow">
                AI SEARCH RESULTS
              </div>

              <h2>
                {assistantResults.message}
              </h2>

              <p>
                {assistantResults.total_results}{" "}
                result(s) found
              </p>

            </div>

            <div className="intent">
              {assistantResults.intent}
            </div>

          </div>

          <div className="results-grid">

            {assistantResults.plots.map(
              (plot) => (

                <div
                  className="property-card"
                  key={plot.plot_id}
                >

                  <div className="property-top">

                    <div className="property-number">
                      {plot.plot_number}
                    </div>

                    <div className="match-score">
                      {plot.match_score}
                      <small>Match</small>
                    </div>

                  </div>

                  <div className="property-location">

                    <MapPin size={16} />

                    {plot.society}

                  </div>

                  <h3>
                    PKR{" "}
                    {plot.demand_price
                      ? (
                          plot.demand_price /
                          1000000
                        ).toFixed(1)
                      : "N/A"}
                    M
                  </h3>

                  <div className="property-details">

                    <span>
                      {plot.size_sqft
                        ? plot.size_sqft.toLocaleString()
                        : "N/A"}{" "}
                      sqft
                    </span>

                    <span>
                      {plot.facing || "N/A"} facing
                    </span>

                    {plot.is_corner && (
                      <span>Corner</span>
                    )}

                  </div>

                  <div className="recommendation">
                    {plot.recommendation}
                  </div>

                  <div className="reasons">

                    {plot.reasons
                      ?.slice(0, 3)
                      .map(
                        (reason, index) => (
                          <span key={index}>
                            {reason}
                          </span>
                        )
                      )}

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      )}

      {/* RECOMMENDATIONS */}

      <section className="recommendations">

        <div className="section-heading">

          <div>

            <div className="eyebrow">
              AI RECOMMENDATIONS
            </div>

            <h2>
              Properties worth exploring
            </h2>

          </div>

        </div>

        <div className="results-grid">

          {recommendations.map(
            (plot) => (

              <div
                className="property-card"
                key={plot.plot_id}
              >

                <div className="property-top">

                  <div className="property-number">
                    {plot.plot_number}
                  </div>

                  <div className="match-score">
                    {plot.match_score}
                    <small>Match</small>
                  </div>

                </div>

                <div className="property-location">

                  <MapPin size={16} />

                  {plot.society}

                </div>

                <h3>
                  PKR{" "}
                  {plot.demand_price
                    ? (
                        plot.demand_price /
                        1000000
                      ).toFixed(1)
                    : "N/A"}
                  M
                </h3>

                <div className="property-details">

                  <span>
                    {plot.size_sqft
                      ? plot.size_sqft.toLocaleString()
                      : "N/A"}{" "}
                    sqft
                  </span>

                  <span>
                    {plot.facing || "N/A"}
                  </span>

                  {plot.is_corner && (
                    <span>Corner</span>
                  )}

                </div>

                <div className="recommendation">
                  {plot.recommendation}
                </div>

              </div>

            )
          )}

        </div>

      </section>

    </main>
  );
}

export default Dashboard;