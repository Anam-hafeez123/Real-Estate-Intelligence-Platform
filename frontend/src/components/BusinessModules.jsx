import { useEffect, useState } from "react";
import {
  Calculator,
  Users,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Building2,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

import api from "../services/api";

function formatPKR(value) {
  const number = Number(value || 0);

  return `PKR ${number.toLocaleString()}`;
}

const styles = {
  wrapper: {
    marginTop: "32px",
    marginBottom: "32px",
  },

  header: {
    marginBottom: "20px",
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: "6px",
  },

  title: {
    fontSize: "28px",
    fontWeight: 800,
    margin: 0,
    color: "#0f172a",
  },

  description: {
    color: "#64748b",
    marginTop: "8px",
  },

  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  },

  tab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "11px 16px",
    borderRadius: "10px",
    border: "1px solid #dbe2ea",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
  },

  activeTab: {
    background: "#0f172a",
    color: "#ffffff",
    borderColor: "#0f172a",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
  },

  panelTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "18px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#475569",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "11px 12px",
    fontSize: "14px",
    outline: "none",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "11px 12px",
    fontSize: "14px",
    background: "#ffffff",
  },

  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    borderRadius: "10px",
    padding: "11px 16px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    padding: "9px 12px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    marginTop: "22px",
  },

  resultCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "15px",
    background: "#f8fafc",
  },

  resultLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "6px",
  },

  resultValue: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
  },

  success: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#ecfdf5",
    color: "#047857",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
  },

  error: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontWeight: 700,
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "22px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "12px",
    color: "#64748b",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    verticalAlign: "top",
  },

  leadCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "15px",
    marginTop: "12px",
    background: "#ffffff",
  },

  leadHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },

  status: {
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "11px",
    fontWeight: 800,
  },

  documentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "11px",
    padding: "12px",
    marginTop: "10px",
  },
};


function ConstructionCalculator() {
  const [form, setForm] = useState({
    plot_size_sqft: "",
    covered_area_sqft: "",
    land_cost: "",
    construction_quality: "Standard",
    construction_rate_per_sqft: "",
    contingency_percentage: 10,
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function calculate() {
    setError("");
    setResult(null);

    if (
      !form.plot_size_sqft ||
      !form.covered_area_sqft
    ) {
      setError(
        "Enter plot size and covered area."
      );
      return;
    }

    try {
      const response = await api.post(
        "/business/construction/calculate",
        {
          plot_size_sqft:
            Number(form.plot_size_sqft),

          covered_area_sqft:
            Number(form.covered_area_sqft),

          land_cost:
            Number(form.land_cost || 0),

          construction_quality:
            form.construction_quality,

          construction_rate_per_sqft:
            form.construction_rate_per_sqft
              ? Number(
                  form.construction_rate_per_sqft
                )
              : null,

          contingency_percentage:
            Number(
              form.contingency_percentage
            ),
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to calculate construction cost."
      );
    }
  }

  return (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>
        <Calculator size={21} />
        Construction Cost Calculator
      </div>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label style={styles.label}>
            Plot Size (sqft)
          </label>

          <input
            style={styles.input}
            type="number"
            value={form.plot_size_sqft}
            onChange={(e) =>
              updateField(
                "plot_size_sqft",
                e.target.value
              )
            }
            placeholder="5000"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Covered Area (sqft)
          </label>

          <input
            style={styles.input}
            type="number"
            value={form.covered_area_sqft}
            onChange={(e) =>
              updateField(
                "covered_area_sqft",
                e.target.value
              )
            }
            placeholder="3000"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Land Cost (PKR)
          </label>

          <input
            style={styles.input}
            type="number"
            value={form.land_cost}
            onChange={(e) =>
              updateField(
                "land_cost",
                e.target.value
              )
            }
            placeholder="45000000"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Construction Quality
          </label>

          <select
            style={styles.select}
            value={form.construction_quality}
            onChange={(e) =>
              updateField(
                "construction_quality",
                e.target.value
              )
            }
          >
            <option>Economy</option>
            <option>Standard</option>
            <option>Premium</option>
            <option>Luxury</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Custom Rate / sqft
          </label>

          <input
            style={styles.input}
            type="number"
            value={
              form.construction_rate_per_sqft
            }
            onChange={(e) =>
              updateField(
                "construction_rate_per_sqft",
                e.target.value
              )
            }
            placeholder="Optional"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Contingency %
          </label>

          <input
            style={styles.input}
            type="number"
            value={
              form.contingency_percentage
            }
            onChange={(e) =>
              updateField(
                "contingency_percentage",
                e.target.value
              )
            }
          />
        </div>
      </div>

      <div style={{ marginTop: "18px" }}>
        <button
          style={styles.button}
          onClick={calculate}
          type="button"
        >
          <Calculator size={17} />
          Calculate Project Cost
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {result && (
        <>
          <div style={styles.success}>
            <CheckCircle2 size={17} />
            Construction estimate calculated.
          </div>

          <div style={styles.resultGrid}>
            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>
                Construction Rate
              </div>

              <div style={styles.resultValue}>
                {formatPKR(
                  result.construction_rate_per_sqft
                )}{" "}
                / sqft
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>
                Construction Cost
              </div>

              <div style={styles.resultValue}>
                {formatPKR(
                  result.construction_cost
                )}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>
                Contingency
              </div>

              <div style={styles.resultValue}>
                {formatPKR(
                  result.contingency_cost
                )}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>
                Land Cost
              </div>

              <div style={styles.resultValue}>
                {formatPKR(
                  result.land_cost
                )}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>
                Total Project Cost
              </div>

              <div style={styles.resultValue}>
                {formatPKR(
                  result.total_project_cost
                )}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>
                Total Cost / Plot sqft
              </div>

              <div style={styles.resultValue}>
                {formatPKR(
                  result.cost_per_plot_sqft
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


function CRM() {
  const [leads, setLeads] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    budget: "",
    interested_society: "",
    interested_plot_id: "",
    status: "New",
    follow_up_date: "",
    notes: "",
  });

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/business/crm/leads"
      );

      setLeads(response.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load CRM leads."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function addLead() {
    setError("");

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      await api.post(
        "/business/crm/leads",
        {
          ...form,

          budget: form.budget
            ? Number(form.budget)
            : null,

          interested_plot_id:
            form.interested_plot_id
              ? Number(
                  form.interested_plot_id
                )
              : null,
        }
      );

      setForm({
        name: "",
        phone: "",
        email: "",
        budget: "",
        interested_society: "",
        interested_plot_id: "",
        status: "New",
        follow_up_date: "",
        notes: "",
      });

      await loadLeads();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to create lead."
      );
    }
  }

  async function deleteLead(id) {
    const confirmed = window.confirm(
      "Delete this customer lead?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/business/crm/leads/${id}`
      );

      await loadLeads();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete lead."
      );
    }
  }

  return (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>
        <Users size={21} />
        Customer Relationship Management
      </div>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label style={styles.label}>
            Customer Name *
          </label>

          <input
            style={styles.input}
            value={form.name}
            onChange={(e) =>
              updateField(
                "name",
                e.target.value
              )
            }
            placeholder="Customer name"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Phone
          </label>

          <input
            style={styles.input}
            value={form.phone}
            onChange={(e) =>
              updateField(
                "phone",
                e.target.value
              )
            }
            placeholder="+92..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Email
          </label>

          <input
            style={styles.input}
            type="email"
            value={form.email}
            onChange={(e) =>
              updateField(
                "email",
                e.target.value
              )
            }
            placeholder="customer@email.com"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Budget (PKR)
          </label>

          <input
            style={styles.input}
            type="number"
            value={form.budget}
            onChange={(e) =>
              updateField(
                "budget",
                e.target.value
              )
            }
            placeholder="50000000"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Interested Society
          </label>

          <input
            style={styles.input}
            value={
              form.interested_society
            }
            onChange={(e) =>
              updateField(
                "interested_society",
                e.target.value
              )
            }
            placeholder="DHA Lahore"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Interested Plot ID
          </label>

          <input
            style={styles.input}
            type="number"
            value={
              form.interested_plot_id
            }
            onChange={(e) =>
              updateField(
                "interested_plot_id",
                e.target.value
              )
            }
            placeholder="1"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Lead Status
          </label>

          <select
            style={styles.select}
            value={form.status}
            onChange={(e) =>
              updateField(
                "status",
                e.target.value
              )
            }
          >
            <option>New</option>
            <option>Contacted</option>
            <option>Interested</option>
            <option>Negotiating</option>
            <option>Converted</option>
            <option>Lost</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Follow-up Date
          </label>

          <input
            style={styles.input}
            type="date"
            value={
              form.follow_up_date
            }
            onChange={(e) =>
              updateField(
                "follow_up_date",
                e.target.value
              )
            }
          />
        </div>

        <div
          style={{
            ...styles.field,
            gridColumn: "1 / -1",
          }}
        >
          <label style={styles.label}>
            Notes
          </label>

          <textarea
            style={{
              ...styles.input,
              minHeight: "90px",
              resize: "vertical",
            }}
            value={form.notes}
            onChange={(e) =>
              updateField(
                "notes",
                e.target.value
              )
            }
            placeholder="Customer requirements and follow-up notes..."
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "18px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          style={styles.button}
          type="button"
          onClick={addLead}
        >
          <Plus size={17} />
          Add Customer
        </button>

        <button
          style={styles.secondaryButton}
          type="button"
          onClick={loadLeads}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.tableWrapper}>
        {loading ? (
          <p>Loading CRM...</p>
        ) : leads.length === 0 ? (
          <p>
            No customers have been added yet.
          </p>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              style={styles.leadCard}
            >
              <div style={styles.leadHeader}>
                <div>
                  <strong>
                    {lead.name}
                  </strong>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {lead.phone ||
                      "No phone"}
                    {" • "}
                    {lead.email ||
                      "No email"}
                  </div>
                </div>

                <span
                  style={styles.status}
                >
                  {lead.status}
                </span>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "10px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <strong>
                    Budget
                  </strong>
                  <br />
                  {lead.budget
                    ? formatPKR(
                        lead.budget
                      )
                    : "Not provided"}
                </div>

                <div>
                  <strong>
                    Society
                  </strong>
                  <br />
                  {lead.interested_society ||
                    "Not provided"}
                </div>

                <div>
                  <strong>
                    Plot ID
                  </strong>
                  <br />
                  {lead.interested_plot_id ||
                    "Not selected"}
                </div>

                <div>
                  <strong>
                    Follow-up
                  </strong>
                  <br />
                  {lead.follow_up_date ||
                    "Not scheduled"}
                </div>
              </div>

              {lead.notes && (
                <p
                  style={{
                    marginTop: "12px",
                    color: "#475569",
                  }}
                >
                  {lead.notes}
                </p>
              )}

              <button
                style={{
                  ...styles.secondaryButton,
                  marginTop: "10px",
                  color: "#b91c1c",
                }}
                type="button"
                onClick={() =>
                  deleteLead(lead.id)
                }
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


function DocumentManagement() {
  const [plotId, setPlotId] = useState("");

  const [documents, setDocuments] =
    useState([]);

  const [title, setTitle] =
    useState("");

  const [documentType, setDocumentType] =
    useState("Ownership");

  const [file, setFile] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function loadDocuments() {
    if (!plotId) {
      setError(
        "Enter a property/plot ID first."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/business/plots/${plotId}/documents`
      );

      setDocuments(
        response.data
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load documents."
      );

      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument() {
    setError("");
    setMessage("");

    if (!plotId) {
      setError(
        "Enter a property/plot ID."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Enter a document title."
      );
      return;
    }

    if (!file) {
      setError(
        "Select a document file."
      );
      return;
    }

    try {
      const formData =
        new FormData();

      formData.append(
        "title",
        title
      );

      formData.append(
        "document_type",
        documentType
      );

      formData.append(
        "file",
        file
      );

      await api.post(
        `/business/plots/${plotId}/documents`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setTitle("");
      setFile(null);

      document.getElementById(
        "property-document-file"
      ).value = "";

      setMessage(
        "Document uploaded successfully."
      );

      await loadDocuments();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to upload document."
      );
    }
  }

  async function deleteDocument(id) {
    const confirmed =
      window.confirm(
        "Delete this document?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/business/documents/${id}`
      );

      await loadDocuments();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete document."
      );
    }
  }

  function downloadDocument(id) {
    window.open(
      `${
        api.defaults.baseURL
      }/business/documents/${id}/download`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>
        <FileText size={21} />
        Property Document Management
      </div>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label style={styles.label}>
            Property / Plot ID *
          </label>

          <input
            style={styles.input}
            type="number"
            value={plotId}
            onChange={(e) =>
              setPlotId(
                e.target.value
              )
            }
            placeholder="Example: 1"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Document Title *
          </label>

          <input
            style={styles.input}
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            placeholder="Ownership document"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Document Type
          </label>

          <select
            style={styles.select}
            value={documentType}
            onChange={(e) =>
              setDocumentType(
                e.target.value
              )
            }
          >
            <option>
              Ownership
            </option>

            <option>
              Registry
            </option>

            <option>
              Agreement
            </option>

            <option>
              Payment
            </option>

            <option>
              Transfer
            </option>

            <option>
              Other
            </option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            File
          </label>

          <input
            id="property-document-file"
            style={styles.input}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) =>
              setFile(
                e.target.files?.[0] ||
                  null
              )
            }
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "18px",
          flexWrap: "wrap",
        }}
      >
        <button
          style={styles.button}
          type="button"
          onClick={uploadDocument}
        >
          <Upload size={17} />
          Upload Document
        </button>

        <button
          style={styles.secondaryButton}
          type="button"
          onClick={loadDocuments}
        >
          <RefreshCw size={16} />
          Load Documents
        </button>
      </div>

      {message && (
        <div style={styles.success}>
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: "22px",
        }}
      >
        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p>
            No documents found for this property.
          </p>
        ) : (
          documents.map(
            (document) => (
              <div
                key={document.id}
                style={styles.documentRow}
              >
                <div>
                  <strong>
                    {document.title}
                  </strong>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {document.document_type}
                    {" • "}
                    {document.filename}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "7px",
                  }}
                >
                  <button
                    style={
                      styles.secondaryButton
                    }
                    type="button"
                    onClick={() =>
                      downloadDocument(
                        document.id
                      )
                    }
                  >
                    <Download
                      size={15}
                    />
                    Download
                  </button>

                  <button
                    style={{
                      ...styles.secondaryButton,
                      color: "#b91c1c",
                    }}
                    type="button"
                    onClick={() =>
                      deleteDocument(
                        document.id
                      )
                    }
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}


export default function BusinessModules() {
  const [activeModule, setActiveModule] =
    useState("construction");

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>
          BUSINESS INTELLIGENCE MODULES
        </div>

        <h2 style={styles.title}>
          Complete property management tools
        </h2>

        <p style={styles.description}>
          Construction planning, customer relationship
          management and property document management.
        </p>
      </div>

      <div style={styles.tabs}>
        <button
          type="button"
          style={{
            ...styles.tab,
            ...(activeModule ===
            "construction"
              ? styles.activeTab
              : {}),
          }}
          onClick={() =>
            setActiveModule(
              "construction"
            )
          }
        >
          <Calculator size={17} />
          Construction Cost
        </button>

        <button
          type="button"
          style={{
            ...styles.tab,
            ...(activeModule === "crm"
              ? styles.activeTab
              : {}),
          }}
          onClick={() =>
            setActiveModule("crm")
          }
        >
          <Users size={17} />
          CRM
        </button>

        <button
          type="button"
          style={{
            ...styles.tab,
            ...(activeModule ===
            "documents"
              ? styles.activeTab
              : {}),
          }}
          onClick={() =>
            setActiveModule(
              "documents"
            )
          }
        >
          <FileText size={17} />
          Documents
        </button>
      </div>

      {activeModule ===
        "construction" && (
        <ConstructionCalculator />
      )}

      {activeModule === "crm" && (
        <CRM />
      )}

      {activeModule ===
        "documents" && (
        <DocumentManagement />
      )}
    </section>
  );
}