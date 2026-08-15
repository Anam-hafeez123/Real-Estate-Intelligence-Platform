import {
  MapPin,
  Maximize,
  Compass,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";

function formatPrice(price) {
  if (price === null || price === undefined) {
    return "N/A";
  }

  return `PKR ${(Number(price) / 1000000).toFixed(2)}M`;
}

function SearchResults({ results = [], onViewDetails }) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <section className="search-results-section">
      <div className="results-header">
        <div>
          <span className="section-label">SEARCH RESULTS</span>

          <h2>Properties matching your requirements</h2>

          <p>
            {results.length}{" "}
            {results.length === 1 ? "property" : "properties"} found based on
            your search.
          </p>
        </div>

        <div className="results-count">
          {results.length}{" "}
          {results.length === 1 ? "Match" : "Matches"}
        </div>
      </div>

      <div className="property-results-grid">
        {results.map((plot) => {
          const plotId = plot.plot_id || plot.id;
          const score = Number(plot.match_score || 0);
          const recommendation =
            plot.recommendation || "Consider Carefully";

          return (
            <article
              className="property-result-card"
              key={plotId}
            >
              <div className="property-card-top">
                <div>
                  <span className="property-type">PLOT</span>

                  <h3>Plot {plot.plot_number || "N/A"}</h3>

                  <div className="property-location">
                    <MapPin size={15} />
                    <span>{plot.society || "Unknown Society"}</span>
                  </div>
                </div>

                <div className="match-score">
                  <span>MATCH</span>
                  <strong>{score}%</strong>
                </div>
              </div>

              <div className="recommendation-badge">
                <Star size={14} />
                {recommendation}
              </div>

              <div className="property-main-price">
                <span>Demand Price</span>

                <strong>
                  {formatPrice(plot.demand_price)}
                </strong>
              </div>

              <div className="property-info-grid">
                <div className="property-info">
                  <Maximize size={17} />

                  <div>
                    <span>Plot Size</span>

                    <strong>
                      {plot.size_sqft
                        ? `${Number(plot.size_sqft).toLocaleString()} sqft`
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="property-info">
                  <Compass size={17} />

                  <div>
                    <span>Facing</span>

                    <strong>
                      {plot.facing || "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="property-info">
                  <CheckCircle2 size={17} />

                  <div>
                    <span>Plot Type</span>

                    <strong>
                      {plot.is_corner ? "Corner" : "Non-Corner"}
                    </strong>
                  </div>
                </div>

                <div className="property-info">
                  <ArrowRight size={17} />

                  <div>
                    <span>Expected Deal</span>

                    <strong>
                      {formatPrice(plot.expected_deal_price)}
                    </strong>
                  </div>
                </div>
              </div>

              {plot.reasons && plot.reasons.length > 0 && (
                <div className="property-reasons">
                  <h4>Why this property?</h4>

                  <ul>
                    {plot.reasons.slice(0, 4).map((reason, index) => (
                      <li
                        key={`${plotId}-reason-${index}`}
                      >
                        <CheckCircle2 size={14} />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                className="view-property-button"
                onClick={() => onViewDetails?.(plot)}
              >
                View Property Details
                <ArrowRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default SearchResults;