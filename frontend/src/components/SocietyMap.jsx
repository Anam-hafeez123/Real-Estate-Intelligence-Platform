import { useEffect, useState } from "react";
import {
  MapPin,
  Building2,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import api from "../services/api";
import "./SocietyMap.css";


// ============================================================
// FIX LEAFLET DEFAULT MARKER ICON
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


// ============================================================
// MAP CENTER COMPONENT
// ============================================================

function MapCenter({ plots }) {
  const map = useMap();

  useEffect(() => {
    if (!plots || plots.length === 0) {
      return;
    }

    const validPlots = plots.filter(
      (plot) =>
        plot.latitude !== null &&
        plot.latitude !== undefined &&
        plot.longitude !== null &&
        plot.longitude !== undefined
    );

    if (validPlots.length === 0) {
      return;
    }

    const bounds = validPlots.map((plot) => [
      Number(plot.latitude),
      Number(plot.longitude),
    ]);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15,
    });
  }, [plots, map]);

  return null;
}


// ============================================================
// FORMAT PRICE
// ============================================================

function formatPrice(value) {
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


// ============================================================
// SOCIETY MAP
// ============================================================

function SocietyMap() {
  const [societies, setSocieties] = useState([]);

  const [selectedSociety, setSelectedSociety] =
    useState("");

  const [plots, setPlots] = useState([]);

  const [loadingSocieties, setLoadingSocieties] =
    useState(true);

  const [loadingPlots, setLoadingPlots] =
    useState(false);

  const [error, setError] = useState("");

  const [selectedPlot, setSelectedPlot] =
    useState(null);


  // ============================================================
  // LOAD SOCIETIES
  // ============================================================

  useEffect(() => {
    loadSocieties();
  }, []);


  async function loadSocieties() {
    try {
      setLoadingSocieties(true);
      setError("");

      const response = await api.get("/plots/societies");

      const data = response.data;

      let societyList = [];

      if (Array.isArray(data)) {
        societyList = data;
      } else if (Array.isArray(data?.societies)) {
        societyList = data.societies;
      }

      setSocieties(societyList);

      if (societyList.length > 0) {
        const firstSociety =
          typeof societyList[0] === "string"
            ? societyList[0]
            : societyList[0].society ||
              societyList[0].name;

        if (firstSociety) {
          setSelectedSociety(firstSociety);
        }
      }
    } catch (error) {
      console.error(
        "Society loading error:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to load societies."
      );
    } finally {
      setLoadingSocieties(false);
    }
  }


  // ============================================================
  // LOAD PLOTS WHEN SOCIETY CHANGES
  // ============================================================

  useEffect(() => {
    if (!selectedSociety) {
      setPlots([]);
      return;
    }

    loadSocietyPlots(selectedSociety);
  }, [selectedSociety]);


  async function loadSocietyPlots(society) {
    try {
      setLoadingPlots(true);
      setError("");
      setSelectedPlot(null);

      const response = await api.get(
        "/plots/map",
        {
          params: {
            society,
          },
        }
      );

      const data = response.data;

      let plotList = [];

      if (Array.isArray(data)) {
        plotList = data;
      } else if (Array.isArray(data?.plots)) {
        plotList = data.plots;
      }

      setPlots(plotList);
    } catch (error) {
      console.error(
        "Society plots error:",
        error
      );

      setPlots([]);

      setError(
        error.response?.data?.detail ||
          "Unable to load society properties."
      );
    } finally {
      setLoadingPlots(false);
    }
  }


  // ============================================================
  // OPEN GOOGLE MAPS
  // ============================================================

  function openGoogleMaps(plot) {
    if (
      plot?.latitude === null ||
      plot?.latitude === undefined ||
      plot?.longitude === null ||
      plot?.longitude === undefined
    ) {
      return;
    }

    const url =
      "https://www.google.com/maps/search/?api=1&query=" +
      `${plot.latitude},${plot.longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }


  // ============================================================
  // VALID MAP PLOTS
  // ============================================================

  const validPlots = plots.filter(
    (plot) =>
      plot.latitude !== null &&
      plot.latitude !== undefined &&
      plot.longitude !== null &&
      plot.longitude !== undefined
  );


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="society-map-section">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="society-map-header">

        <div>

          <div className="society-map-eyebrow">
            LOCATION INTELLIGENCE
          </div>

          <h2>
            Society Maps
          </h2>

          <p>
            Explore available properties by
            society and view their geographic
            locations.
          </p>

        </div>


        <div className="society-map-icon">
          <MapPin size={24} />
        </div>

      </div>


      {/* ======================================================
          CONTROLS
      ======================================================= */}

      <div className="society-map-controls">

        <div className="society-select-wrapper">

          <label htmlFor="society-select">
            Select Society
          </label>

          <select
            id="society-select"
            value={selectedSociety}
            onChange={(event) =>
              setSelectedSociety(
                event.target.value
              )
            }
            disabled={
              loadingSocieties ||
              societies.length === 0
            }
          >

            {loadingSocieties ? (
              <option value="">
                Loading societies...
              </option>
            ) : societies.length === 0 ? (
              <option value="">
                No societies available
              </option>
            ) : (
              societies.map(
                (society, index) => {

                  const name =
                    typeof society === "string"
                      ? society
                      : society.society ||
                        society.name;

                  return (
                    <option
                      value={name}
                      key={`${name}-${index}`}
                    >
                      {name}
                    </option>
                  );
                }
              )
            )}

          </select>

        </div>


        <div className="society-map-stats">

          <div className="map-stat">

            <Building2 size={16} />

            <div>
              <span>
                Properties
              </span>

              <strong>
                {plots.length}
              </strong>
            </div>

          </div>


          <div className="map-stat">

            <MapPin size={16} />

            <div>
              <span>
                Mapped
              </span>

              <strong>
                {validPlots.length}
              </strong>
            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (

        <div className="society-map-error">

          <AlertCircle size={17} />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ======================================================
          MAP
      ======================================================= */}

      <div className="society-map-container">

        {loadingPlots ? (

          <div className="society-map-loading">

            <Loader2
              size={28}
              className="society-map-spinner"
            />

            <span>
              Loading property locations...
            </span>

          </div>

        ) : validPlots.length > 0 ? (

          <MapContainer
            center={[
              Number(
                validPlots[0].latitude
              ),
              Number(
                validPlots[0].longitude
              ),
            ]}
            zoom={13}
            scrollWheelZoom={true}
            className="society-leaflet-map"
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapCenter
              plots={validPlots}
            />


            {validPlots.map(
              (plot) => (

                <Marker
                  key={
                    plot.plot_id ??
                    plot.id ??
                    plot.plot_number
                  }
                  position={[
                    Number(plot.latitude),
                    Number(plot.longitude),
                  ]}
                  eventHandlers={{
                    click: () =>
                      setSelectedPlot(plot),
                  }}
                >

                  <Popup>

                    <div className="map-popup">

                      <strong>
                        Plot{" "}
                        {plot.plot_number ||
                          "N/A"}
                      </strong>

                      <span>
                        {plot.society ||
                          selectedSociety}
                      </span>

                      {plot.phase && (
                        <span>
                          Phase:{" "}
                          {plot.phase}
                        </span>
                      )}

                      {plot.block && (
                        <span>
                          Block:{" "}
                          {plot.block}
                        </span>
                      )}

                      <span>
                        Price:{" "}
                        {formatPrice(
                          plot.demand_price
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPlot(
                            plot
                          )
                        }
                      >
                        View Details
                      </button>

                    </div>

                  </Popup>

                </Marker>

              )
            )}

          </MapContainer>

        ) : (

          <div className="society-map-empty">

            <MapPin size={32} />

            <h3>
              No mapped properties
            </h3>

            <p>
              This society currently has no
              properties with GPS coordinates.
            </p>

          </div>

        )}

      </div>


      {/* ======================================================
          SELECTED PROPERTY
      ======================================================= */}

      {selectedPlot && (

        <div className="selected-map-property">

          <div className="selected-property-main">

            <div className="selected-property-icon">
              <Building2 size={20} />
            </div>

            <div>

              <span>
                SELECTED PROPERTY
              </span>

              <h3>
                Plot{" "}
                {selectedPlot.plot_number ||
                  "N/A"}
              </h3>

              <p>
                {selectedPlot.society ||
                  selectedSociety}

                {selectedPlot.phase &&
                  ` • ${selectedPlot.phase}`}

                {selectedPlot.block &&
                  ` • ${selectedPlot.block}`}
              </p>

            </div>

          </div>


          <div className="selected-property-details">

            <div>
              <span>
                Demand Price
              </span>

              <strong>
                {formatPrice(
                  selectedPlot.demand_price
                )}
              </strong>
            </div>


            <div>
              <span>
                Size
              </span>

              <strong>
                {selectedPlot.size_sqft
                  ? `${Number(
                      selectedPlot.size_sqft
                    ).toLocaleString()} sqft`
                  : "N/A"}
              </strong>
            </div>


            <div>
              <span>
                Facing
              </span>

              <strong>
                {selectedPlot.facing ||
                  "N/A"}
              </strong>
            </div>


            <div>
              <span>
                Type
              </span>

              <strong>
                {selectedPlot.is_corner
                  ? "Corner"
                  : "Non-Corner"}
              </strong>
            </div>

          </div>


          <button
            type="button"
            className="open-map-button"
            onClick={() =>
              openGoogleMaps(selectedPlot)
            }
          >

            <MapPin size={17} />

            Open Property in Google Maps

            <ExternalLink size={15} />

          </button>

        </div>

      )}

    </section>
  );
}

export default SocietyMap;