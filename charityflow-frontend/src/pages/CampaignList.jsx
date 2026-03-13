import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CampaignCard from "../components/CampaignCard";
import { useWeb3 } from "../context/Web3Context";
import { MOCK_CAMPAIGNS } from "../utils/contract";
import "./CampaignList.css";

const CATEGORIES = ["All", "Health", "Education", "Environment", "Humanitarian"];
const STATUSES = ["All", "Active", "Completed", "Cancelled"];
const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "raised", label: "Most Raised" },
  { value: "progress", label: "Closest to Goal" },
  { value: "donors", label: "Most Donors" },
];

export default function CampaignList() {
  const { contract } = useWeb3();
  const [campaigns, setCampaigns] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [contract]);

  async function loadCampaigns() {
    setLoading(true);
    try {
      if (contract) {
        const total = await contract.getTotalCampaigns();
        const loaded = [];
        for (let i = 1; i <= Number(total); i++) {
          const c = await contract.getCampaign(i);
          loaded.push(c);
        }
        setCampaigns(loaded);
      } else {
        // Demo mode
        setCampaigns(MOCK_CAMPAIGNS);
      }
    } catch (e) {
      console.error("Failed to load campaigns:", e);
      setCampaigns(MOCK_CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = [...campaigns];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category !== "All") {
      result = result.filter((c) => c.category === category);
    }

    // Status filter — compare as numbers to handle both BigInt and plain number status values
    if (status !== "All") {
      const statusMap = { Active: 0, Completed: 1, Cancelled: 2 };
      result = result.filter((c) => Number(c.status) === statusMap[status]);
    }

    // Sort
    if (sort === "newest") result.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    if (sort === "oldest") result.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
    if (sort === "raised") result.sort((a, b) => Number(b.raisedAmount) - Number(a.raisedAmount));
    if (sort === "progress") {
      result.sort((a, b) => {
        const pa = Number(a.raisedAmount) / Number(a.goalAmount);
        const pb = Number(b.raisedAmount) / Number(b.goalAmount);
        return pb - pa;
      });
    }
    if (sort === "donors") result.sort((a, b) => Number(b.donorCount) - Number(a.donorCount));

    setFiltered(result);
  }, [campaigns, search, category, status, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setSort("newest");
  };

  const hasFilters = search || category !== "All" || status !== "All";

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 style={{ marginBottom: "6px" }}>Campaigns</h1>
          <p className="caption" style={{ fontSize: "15px" }}>
            {loading ? "Loading..." : `${filtered.length} of ${campaigns.length} campaigns`}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Search + Filter Bar */}
        <div className="filter-bar">
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              className="input search-input"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className={`btn btn-secondary btn-sm filter-toggle${filtersOpen ? " active" : ""}`}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal size={15} />
            Filters{hasFilters ? " (on)" : ""}
          </button>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="filter-panel card">
            <div className="filter-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="pill-group">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`pill-btn${category === cat ? " active" : ""}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="pill-group">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`pill-btn${status === s ? " active" : ""}`}
                      onClick={() => setStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sort by</label>
                <select
                  className="input"
                  style={{ maxWidth: "200px" }}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasFilters && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: "12px" }}
                onClick={clearFilters}
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Campaign Grid */}
        {loading ? (
          <div className="grid-3" style={{ marginTop: "32px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: "280px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={40} strokeWidth={1} />
            <h3 style={{ marginTop: "16px" }}>No campaigns found</h3>
            <p className="caption">Try adjusting your filters or search terms.</p>
            {hasFilters && (
              <button className="btn btn-secondary btn-sm" style={{ marginTop: "16px" }} onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid-3" style={{ marginTop: "32px" }}>
            {filtered.map((c) => (
              <CampaignCard key={String(c.id)} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
