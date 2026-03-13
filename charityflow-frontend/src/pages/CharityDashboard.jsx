import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  Plus, Wallet, BarChart3, FileText, TrendingUp, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Upload, Activity, ExternalLink
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  MOCK_CAMPAIGNS, MOCK_WITHDRAWALS, MOCK_PROOFS,
  NETWORK_NAME,
  fetchActivityFeed,
  formatEth,
  campaignProgress,
  campaignStatusLabel,
  txExplorerUrl,
} from "../utils/contract";
import IPFSUpload from "../components/IPFSUpload";
import "./CharityDashboard.css";

const CATEGORIES = ["Health", "Education", "Environment", "Humanitarian", "Animal Welfare", "Disaster Relief", "Arts & Culture", "Other"];

function CampaignRow({ campaign, onExpand, expanded, contract, reload }) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const progress = campaignProgress(campaign.raisedAmount, campaign.goalAmount);

  // Withdrawal form
  const [wAmount, setWAmount] = useState("");
  const [wPurpose, setWPurpose] = useState("");
  const [wProofHash, setWProofHash] = useState("");

  // Proof form
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pHash, setPHash] = useState("");
  const [pAmount, setPAmount] = useState("");

  // Report form
  const [rTitle, setRTitle] = useState("");
  const [rContent, setRContent] = useState("");
  const [rMediaHashes, setRMediaHashes] = useState([]);

  const [activeForm, setActiveForm] = useState(null);

  async function handleWithdraw(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const tx = await contract.withdrawFunds(
        campaign.id,
        ethers.parseEther(wAmount),
        wPurpose,
        wProofHash || "QmNoProof"
      );
      setStatus({ type: "info", msg: "Transaction submitted..." });
      await tx.wait();
      setStatus({ type: "success", msg: `Withdrawal of ${wAmount} ETH confirmed.` });
      setWAmount(""); setWPurpose(""); setWProofHash("");
      reload();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Transaction failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProof(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const tx = await contract.submitProof(
        campaign.id, pTitle, pDesc, pHash || "QmNoHash",
        ethers.parseEther(pAmount || "0")
      );
      setStatus({ type: "info", msg: "Submitting proof..." });
      await tx.wait();
      setStatus({ type: "success", msg: "Proof submitted successfully." });
      setPTitle(""); setPDesc(""); setPHash(""); setPAmount("");
      reload();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReport(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const tx = await contract.postImpactReport(campaign.id, rTitle, rContent, rMediaHashes);
      setStatus({ type: "info", msg: "Posting report..." });
      await tx.wait();
      setStatus({ type: "success", msg: "Impact report posted." });
      setRTitle(""); setRContent(""); setRMediaHashes([]);
      reload();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  }

  const availableBalance = campaign.raisedAmount - campaign.withdrawnAmount;

  return (
    <div className="campaign-row-card card">
      {/* Campaign header */}
      <div className="campaign-row-header" onClick={() => onExpand(campaign.id)}>
        <div className="campaign-row-info">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600 }}>{campaign.title}</h3>
            <span className={`badge badge-${["active","completed","cancelled"][Number(campaign.status)]}`}>
              {campaignStatusLabel(campaign.status)}
            </span>
            {campaign.verified && (
              <span className="badge badge-verified-glow" style={{ fontSize: "11px" }}>Verified</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <span className="caption">
              Raised: <strong style={{ color: "var(--cf-teal-1)" }}>{formatEth(campaign.raisedAmount, 3)} ETH</strong>
            </span>
            <span className="caption">Goal: {formatEth(campaign.goalAmount, 2)} ETH</span>
            <span className="caption">Available: {formatEth(availableBalance, 4)} ETH</span>
            <span className="caption">Donors: {Number(campaign.donorCount)}</span>
          </div>
          <div style={{ marginTop: "8px" }}>
            <div className="progress-bar" style={{ height: "4px" }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="campaign-row-expand">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="campaign-row-body">
          {status && (
            <div className={`alert alert-${status.type === "success" ? "success" : status.type === "info" ? "info" : "error"}`} style={{ marginBottom: "16px" }}>
              {status.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span style={{ fontSize: "13px" }}>{status.msg}</span>
            </div>
          )}

          {/* Action tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[
              { key: "withdraw", label: "Withdraw Funds", icon: Wallet },
              { key: "proof", label: "Submit Proof", icon: Upload },
              { key: "report", label: "Impact Report", icon: TrendingUp },
            ].map((action) => (
              <button
                key={action.key}
                className={`btn btn-sm ${activeForm === action.key ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveForm(activeForm === action.key ? null : action.key)}
              >
                <action.icon size={13} /> {action.label}
              </button>
            ))}
            <Link to={`/campaigns/${campaign.id}`} className="btn btn-sm btn-secondary">
              <Activity size={13} /> View Campaign
            </Link>
          </div>

          {/* Withdraw form */}
          {activeForm === "withdraw" && (
            <form className="action-form" onSubmit={handleWithdraw}>
              <h4 style={{ marginBottom: "14px", fontSize: "14px", fontWeight: 600 }}>Withdraw Funds</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Amount (ETH)</label>
                  <input className="input" type="number" step="0.001" min="0.001"
                    placeholder="0.00" value={wAmount} onChange={(e) => setWAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <IPFSUpload
                    label="Receipt / Proof (optional)"
                    value={wProofHash}
                    onChange={setWProofHash}
                    accept="image/*,.pdf"
                    placeholder="Upload receipt or invoice to IPFS"
                    showPreview={false}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label className="form-label">Purpose (required)</label>
                <input className="input" placeholder="e.g. Purchase of water pumps from Supplier X" value={wPurpose}
                  onChange={(e) => setWPurpose(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }} disabled={submitting}>
                {submitting ? "Processing..." : "Submit Withdrawal"}
              </button>
              <p className="caption" style={{ marginTop: "8px" }}>
                Available: {formatEth(availableBalance, 4)} ETH. All withdrawals are logged on-chain.
              </p>
            </form>
          )}

          {/* Proof form */}
          {activeForm === "proof" && (
            <form className="action-form" onSubmit={handleProof}>
              <h4 style={{ marginBottom: "14px", fontSize: "14px", fontWeight: 600 }}>Submit Proof of Work</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Proof Title</label>
                  <input className="input" placeholder="e.g. Invoice #4512" value={pTitle}
                    onChange={(e) => setPTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Spent (ETH)</label>
                  <input className="input" type="number" step="0.001" placeholder="0.00"
                    value={pAmount} onChange={(e) => setPAmount(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label className="form-label">Description</label>
                <textarea className="input" placeholder="Describe what was done or purchased..."
                  value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <IPFSUpload
                  label="Proof Document (image or PDF)"
                  value={pHash}
                  onChange={setPHash}
                  accept="image/*,.pdf"
                  placeholder="Upload invoice, photo, or receipt"
                  showPreview={false}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Proof"}
              </button>
            </form>
          )}

          {/* Impact Report form */}
          {activeForm === "report" && (
            <form className="action-form" onSubmit={handleReport}>
              <h4 style={{ marginBottom: "14px", fontSize: "14px", fontWeight: 600 }}>Post Impact Report</h4>
              <div className="form-group">
                <label className="form-label">Report Title</label>
                <input className="input" placeholder="e.g. Week 3 Update: Water Access Restored" value={rTitle}
                  onChange={(e) => setRTitle(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label className="form-label">Report Content</label>
                <textarea className="input" style={{ minHeight: "120px" }}
                  placeholder="Describe the impact achieved, milestones reached, and what's next..."
                  value={rContent} onChange={(e) => setRContent(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <IPFSUpload
                  label="Media attachments (optional)"
                  value={rMediaHashes}
                  onChange={setRMediaHashes}
                  accept="image/*,.pdf"
                  placeholder="Add photos or documents"
                  showPreview={false}
                  multiple={true}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }} disabled={submitting}>
                {submitting ? "Posting..." : "Post Impact Report"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function CharityDashboard() {
  const { contract, account, isConnected, connect, isCorrectNetwork, switchNetwork } = useWeb3();
  const [campaigns, setCampaigns] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState(null);

  // Create campaign form
  const [form, setForm] = useState({
    title: "", description: "", category: "Health", imageHash: "",
    goalAmount: "", durationDays: "30"
  });

  useEffect(() => {
    loadCampaigns();
  }, [account, contract]);

  async function loadCampaigns() {
    if (!isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      if (contract && account) {
        const ids = await contract.getCharityCampaigns(account);
        const list = await Promise.all(ids.map((id) => contract.getCampaign(id)));
        setCampaigns(list);

        setActivityLoading(true);
        const feed = await fetchActivityFeed(contract, {
          account,
          campaignIds: list.map((c) => Number(c.id)),
          limit: 25,
        });
        setActivity(feed);
      } else {
        setCampaigns(MOCK_CAMPAIGNS.slice(0, 2));
        setActivity([]);
      }
    } catch (e) {
      console.error(e);
      setCampaigns(MOCK_CAMPAIGNS.slice(0, 2));
      setActivity([]);
    } finally {
      setActivityLoading(false);
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateStatus(null);
    try {
      const tx = await contract.createCampaign(
        form.title, form.description, form.category,
        form.imageHash || "QmNoImage",
        ethers.parseEther(form.goalAmount),
        parseInt(form.durationDays)
      );
      setCreateStatus({ type: "info", msg: "Transaction submitted..." });
      await tx.wait();
      setCreateStatus({ type: "success", msg: "Campaign created successfully!" });
      setForm({ title: "", description: "", category: "Health", imageHash: "", goalAmount: "", durationDays: "30" });
      setShowCreate(false);
      loadCampaigns();
    } catch (e) {
      setCreateStatus({ type: "error", msg: e.reason || e.message || "Failed to create campaign." });
    } finally {
      setCreating(false);
    }
  }

  function handleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  const totalRaised = campaigns.reduce((sum, c) => sum + BigInt(c.raisedAmount || 0), 0n);
  const totalWithdrawn = campaigns.reduce((sum, c) => sum + BigInt(c.withdrawnAmount || 0), 0n);

  if (!isConnected) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <Wallet size={52} strokeWidth={1} style={{ color: "var(--cf-text-muted)" }} />
        <h2 style={{ marginTop: "16px", marginBottom: "8px" }}>Connect Your Wallet</h2>
        <p className="caption">Connect your MetaMask wallet to access the Charity Portal.</p>
        <button className="btn btn-primary" style={{ marginTop: "24px" }} onClick={connect}>
          <Wallet size={16} /> Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ marginBottom: "4px" }}>Charity Portal</h1>
              <p className="caption">Manage your campaigns with full on-chain transparency.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate((o) => !o)}>
              <Plus size={16} /> Create Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {!isCorrectNetwork && (
          <div className="alert alert-info" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: "13px" }}>
              This panel is set for {NETWORK_NAME}. Switch networks to create real testnet charities and transactions.
            </span>
            <button className="btn btn-secondary btn-sm" onClick={switchNetwork}>
              Switch Network
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", marginBottom: "32px" }}>
          <div className="card" style={{ cursor: "default", textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--cf-teal-1)", marginBottom: "4px" }}>{campaigns.length}</div>
            <div className="caption">Total Campaigns</div>
          </div>
          <div className="card" style={{ cursor: "default", textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--cf-teal-1)", marginBottom: "4px" }}>{formatEth(totalRaised, 3)} ETH</div>
            <div className="caption">Total Raised</div>
          </div>
          <div className="card" style={{ cursor: "default", textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--cf-teal-1)", marginBottom: "4px" }}>{formatEth(totalWithdrawn, 3)} ETH</div>
            <div className="caption">Total Withdrawn</div>
          </div>
        </div>

        {/* Create Campaign Form */}
        {showCreate && (
          <div className="card create-form-card">
            <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Create New Campaign</h2>

            {createStatus && (
              <div className={`alert alert-${createStatus.type === "success" ? "success" : createStatus.type === "info" ? "info" : "error"}`} style={{ marginBottom: "16px" }}>
                {createStatus.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                <span style={{ fontSize: "13px" }}>{createStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Campaign Title</label>
                <input className="input" placeholder="e.g. Clean Water for Village X" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Description</label>
                <textarea className="input" style={{ minHeight: "100px" }}
                  placeholder="Describe your campaign, its goals, and how funds will be used..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>

              <div className="form-row-3" style={{ marginBottom: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Goal Amount (ETH)</label>
                  <input className="input" type="number" step="0.1" min="0.01" placeholder="5.0"
                    value={form.goalAmount} onChange={(e) => setForm({ ...form, goalAmount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (days)</label>
                  <input className="input" type="number" min="1" max="365" placeholder="30"
                    value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <IPFSUpload
                  label="Cover Image (optional)"
                  value={form.imageHash}
                  onChange={(hash) => setForm({ ...form, imageHash: hash })}
                  accept="image/*"
                  placeholder="Select an image, then click Upload to store on IPFS"
                  showPreview={true}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Campaign"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 style={{ fontSize: "20px", marginBottom: "20px", marginTop: "30px" }}>Real On-Chain Activity</h2>
        {activityLoading ? (
          <div className="skeleton" style={{ height: "120px", marginBottom: "24px" }} />
        ) : activity.length === 0 ? (
          <div className="card" style={{ cursor: "default", marginBottom: "24px" }}>
            <p className="caption">No activity yet. Create a campaign or wait for donor transactions.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {activity.map((item) => (
              <div key={item.id} className="card" style={{ cursor: "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{item.title}</div>
                    <div className="caption" style={{ marginTop: "4px" }}>
                      {item.detail} • Block #{item.blockNumber}
                    </div>
                  </div>
                  {txExplorerUrl(item.txHash) ? (
                    <a
                      href={txExplorerUrl(item.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      View Tx <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="mono caption">{item.txHash?.slice(0, 10)}...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campaign List */}
        <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Your Campaigns</h2>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: "100px" }} />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px", cursor: "default" }}>
            <BarChart3 size={40} strokeWidth={1} style={{ color: "var(--cf-text-muted)" }} />
            <h3 style={{ marginTop: "16px", marginBottom: "8px" }}>No campaigns yet</h3>
            <p className="caption">Create your first campaign to start raising funds transparently.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: "16px" }} onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {campaigns.map((c) => (
              <CampaignRow
                key={String(c.id)}
                campaign={c}
                contract={contract}
                expanded={expandedId === c.id}
                onExpand={handleExpand}
                reload={loadCampaigns}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
