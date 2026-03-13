import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  Shield, Clock, Users, ArrowLeft, ExternalLink, CheckCircle, AlertCircle,
  FileText, TrendingUp, Activity, UploadCloud
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import FundFlowTimeline from "../components/FundFlowTimeline";
import {
  MOCK_CAMPAIGNS, MOCK_DONATIONS, MOCK_PROOFS, MOCK_WITHDRAWALS,
  formatEth, campaignProgress, campaignStatusLabel, daysLeft,
  formatTimestamp, shortAddress, shortHash
} from "../utils/contract";
import { ipfsUrl } from "../utils/ipfs";
import "./CampaignDetail.css";

export default function CampaignDetail() {
  const { id } = useParams();
  const { contract, account, isConnected, connect } = useWeb3();

  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState("flow");

  // Donation form
  const [donateAmount, setDonateAmount] = useState("");
  const [donateMsg, setDonateMsg] = useState("");
  const [donating, setDonating] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // {type, msg}

  useEffect(() => {
    loadData();
  }, [id, contract]);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      if (contract) {
        const c = await contract.getCampaign(id);
        setCampaign(c);

        const donationIds = await contract.getCampaignDonations(id);
        const donationList = await Promise.all(donationIds.map((did) => contract.getDonation(did)));
        setDonations(donationList);

        const proofIds = await contract.getCampaignProofs(id);
        const proofList = await Promise.all(proofIds.map((pid) => contract.getProof(pid)));
        setProofs(proofList);

        const wIds = await contract.getCampaignWithdrawals(id);
        const wList = await Promise.all(wIds.map((wid) => contract.getWithdrawal(wid)));
        setWithdrawals(wList);

        const rIds = await contract.getCampaignReports(id);
        const rList = await Promise.all(rIds.map((rid) => contract.getImpactReport(rid)));
        setReports(rList);
      } else {
        loadMockData();
      }
    } catch (e) {
      console.error("Failed to load campaign from contract, falling back to demo data:", e);
      setLoadError(e.message || String(e));
      loadMockData();
    } finally {
      setLoading(false);
    }
  }

  function loadMockData() {
    // Compare numerically so BigInt IDs like 2n match the string "2" from the URL
    const numId = Number(id);
    const c = MOCK_CAMPAIGNS.find((c) => Number(c.id) === numId);
    if (c) {
      setCampaign(c);
      setDonations(MOCK_DONATIONS.filter((d) => Number(d.campaignId) === numId));
      setProofs(MOCK_PROOFS.filter((p) => Number(p.campaignId) === numId));
      setWithdrawals(MOCK_WITHDRAWALS.filter((w) => Number(w.campaignId) === numId));
      setReports([]);
    }
  }

  async function handleDonate(e) {
    e.preventDefault();
    if (!isConnected) { connect(); return; }
    if (!donateAmount || parseFloat(donateAmount) <= 0) return;

    setDonating(true);
    setTxStatus(null);
    try {
      const tx = await contract.donate(id, donateMsg, {
        value: ethers.parseEther(donateAmount),
      });
      setTxStatus({ type: "info", msg: "Transaction submitted. Waiting for confirmation..." });
      await tx.wait();
      setTxStatus({ type: "success", msg: `Donation of ${donateAmount} ETH confirmed! Thank you for your generosity.` });
      setDonateAmount("");
      setDonateMsg("");
      loadData();
    } catch (e) {
      setTxStatus({ type: "error", msg: e.reason || e.message || "Transaction failed." });
    } finally {
      setDonating(false);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 24px" }}>
        <div className="skeleton" style={{ height: "40px", maxWidth: "300px", marginBottom: "24px" }} />
        <div className="skeleton" style={{ height: "200px", marginBottom: "16px" }} />
        <div className="skeleton" style={{ height: "400px" }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <AlertCircle size={48} strokeWidth={1} style={{ color: "var(--cf-text-muted)" }} />
        <h2 style={{ marginTop: "16px" }}>Campaign #{id} not found</h2>
        <p className="caption" style={{ marginTop: "8px" }}>
          {loadError
            ? "Could not load from blockchain — make sure the Hardhat node is running and the contract is deployed."
            : "This campaign ID does not exist in the demo data."}
        </p>
        {loadError && (
          <p className="mono" style={{ fontSize: "12px", color: "var(--cf-text-muted)", marginTop: "8px", wordBreak: "break-all" }}>
            {loadError}
          </p>
        )}
        <Link to="/campaigns" className="btn btn-secondary btn-sm" style={{ marginTop: "20px" }}>
          <ArrowLeft size={14} /> Back to campaigns
        </Link>
      </div>
    );
  }

  const progress = campaignProgress(campaign.raisedAmount, campaign.goalAmount);
  const days = daysLeft(campaign.deadline);
  const status = Number(campaign.status);
  const availableBalance = campaign.raisedAmount - campaign.withdrawnAmount;

  const TABS = [
    { key: "flow", label: "Fund Flow", icon: Activity },
    { key: "proofs", label: `Proofs (${proofs.length})`, icon: FileText },
    { key: "reports", label: `Impact (${reports.length})`, icon: TrendingUp },
    { key: "txns", label: `Transactions (${donations.length})`, icon: UploadCloud },
  ];

  return (
    <div className="campaign-detail" style={{ paddingBottom: "80px" }}>
      <div className="container">
        {/* Back */}
        <Link to="/campaigns" className="back-link">
          <ArrowLeft size={16} /> All Campaigns
        </Link>

        {campaign.imageHash && (
          <div style={{ marginBottom: "24px", borderRadius: "12px", overflow: "hidden", maxHeight: "280px" }}>
            <img
              src={ipfsUrl(campaign.imageHash)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        )}

        <div className="detail-grid">
          {/* Left: Campaign Info */}
          <div className="detail-main">
            {/* Header */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <span className="badge badge-category">{campaign.category}</span>
              {campaign.verified && (
                <span className="badge badge-verified-glow">
                  <Shield size={10} /> Verified
                </span>
              )}
              <span className={`badge badge-${["active","completed","cancelled"][status]}`}>
                {campaignStatusLabel(campaign.status)}
              </span>
            </div>

            <h1 style={{ fontSize: "28px", lineHeight: "36px", marginBottom: "12px" }}>
              {campaign.title}
            </h1>

            <p style={{ color: "var(--cf-text-muted)", lineHeight: "26px", marginBottom: "24px" }}>
              {campaign.description}
            </p>

            {/* Stats row */}
            <div className="campaign-stats-row">
              <div className="campaign-stat">
                <div className="campaign-stat-value gradient-text">
                  {formatEth(campaign.raisedAmount, 3)} ETH
                </div>
                <div className="caption">Raised of {formatEth(campaign.goalAmount, 2)} ETH goal</div>
              </div>
              <div className="campaign-stat">
                <div className="campaign-stat-value">{Number(campaign.donorCount)}</div>
                <div className="caption">Donors</div>
              </div>
              <div className="campaign-stat">
                <div className="campaign-stat-value">
                  {status === 0 && days > 0 ? `${days}d` : status === 1 ? "Done" : "Ended"}
                </div>
                <div className="caption">{status === 0 && days > 0 ? "Remaining" : "Status"}</div>
              </div>
              <div className="campaign-stat">
                <div className="campaign-stat-value">{formatEth(availableBalance, 3)} ETH</div>
                <div className="caption">Available balance</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: "32px" }}>
              <div className="progress-bar" style={{ height: "8px" }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <span className="caption">{progress}% funded</span>
                <span className="caption">
                  Charity: {shortAddress(campaign.charity)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="detail-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`detail-tab${activeTab === tab.key ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Fund Flow */}
            {activeTab === "flow" && (
              <div className="card tab-content">
                <h3 style={{ marginBottom: "24px", fontSize: "16px" }}>Donation Fund Flow</h3>
                <FundFlowTimeline
                  donation={donations[0] || null}
                  withdrawals={withdrawals}
                  proofs={proofs}
                />
              </div>
            )}

            {/* Tab: Proofs */}
            {activeTab === "proofs" && (
              <div className="tab-content">
                {proofs.length === 0 ? (
                  <div className="card" style={{ textAlign: "center", padding: "40px", cursor: "default" }}>
                    <FileText size={36} strokeWidth={1} style={{ color: "var(--cf-text-muted)" }} />
                    <p className="caption" style={{ marginTop: "12px" }}>No proofs submitted yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {proofs.map((proof) => (
                      <div key={String(proof.id)} className="card proof-card">
                        <div className="proof-header">
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: "4px" }}>{proof.title}</div>
                            <span className="caption">{formatTimestamp(proof.timestamp)}</span>
                          </div>
                          {proof.verified ? (
                            <span className="badge badge-verified-glow">
                              <CheckCircle size={11} /> Verified
                            </span>
                          ) : (
                            <span className="badge badge-category">Pending review</span>
                          )}
                        </div>
                        <p className="caption" style={{ marginTop: "10px", lineHeight: "20px" }}>
                          {proof.description}
                        </p>
                        <div className="proof-footer">
                          <span style={{ fontSize: "13px" }}>
                            Amount: <strong>{formatEth(proof.amountSpent, 4)} ETH</strong>
                          </span>
                          <a
                            href={ipfsUrl(proof.fileHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="mono"
                            style={{ fontSize: "12px", color: "var(--cf-teal-1)" }}
                          >
                            View proof on IPFS <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Impact Reports */}
            {activeTab === "reports" && (
              <div className="tab-content">
                {reports.length === 0 ? (
                  <div className="card" style={{ textAlign: "center", padding: "40px", cursor: "default" }}>
                    <TrendingUp size={36} strokeWidth={1} style={{ color: "var(--cf-text-muted)" }} />
                    <p className="caption" style={{ marginTop: "12px" }}>No impact reports posted yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {reports.map((report) => (
                      <div key={String(report.id)} className="card" style={{ cursor: "default" }}>
                        <div style={{ fontWeight: 600, marginBottom: "6px" }}>{report.title}</div>
                        <span className="caption">{formatTimestamp(report.timestamp)}</span>
                        <p style={{ marginTop: "10px", lineHeight: "24px", fontSize: "14px" }}>
                          {report.content}
                        </p>
                        {report.mediaHashes && report.mediaHashes.length > 0 && (
                          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {report.mediaHashes.map((h, idx) => (
                              <a
                                key={idx}
                                href={ipfsUrl(h)}
                                target="_blank"
                                rel="noreferrer"
                                className="badge badge-category"
                                style={{ textDecoration: "none" }}
                              >
                                <FileText size={10} /> Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: On-Chain Transactions */}
            {activeTab === "txns" && (
              <div className="tab-content">
                <div className="card" style={{ cursor: "default", padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--cf-border)" }}>
                    <h3 style={{ fontSize: "15px" }}>On-Chain Donations</h3>
                  </div>
                  {donations.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                      <p className="caption">No donations yet.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Donor</th>
                            <th>Amount</th>
                            <th>Timestamp</th>
                            <th>Message</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donations.map((d) => (
                            <tr key={String(d.id)}>
                              <td>
                                <span className="mono">{shortAddress(d.donor)}</span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: "var(--cf-teal-1)" }}>
                                  {formatEth(d.amount, 4)} ETH
                                </span>
                              </td>
                              <td className="caption">{formatTimestamp(d.timestamp)}</td>
                              <td className="caption">{d.message || "—"}</td>
                              <td>
                                {d.refunded ? (
                                  <span className="badge badge-cancelled">Refunded</span>
                                ) : (
                                  <span className="badge badge-active">Confirmed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {withdrawals.length > 0 && (
                  <div className="card" style={{ cursor: "default", padding: 0, overflow: "hidden", marginTop: "16px" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--cf-border)" }}>
                      <h3 style={{ fontSize: "15px" }}>Withdrawal Records</h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>Purpose</th>
                            <th>Date</th>
                            <th>Proof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map((w) => (
                            <tr key={String(w.id)}>
                              <td>
                                <span style={{ fontWeight: 600 }}>{formatEth(w.amount, 4)} ETH</span>
                              </td>
                              <td className="caption">{w.purpose}</td>
                              <td className="caption">{formatTimestamp(w.timestamp)}</td>
                              <td>
                                {w.proofHash ? (
                                  <a
                                    href={ipfsUrl(w.proofHash)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mono"
                                    style={{ fontSize: "11px", color: "var(--cf-teal-1)" }}
                                  >
                                    View receipt
                                  </a>
                                ) : (
                                  <span className="caption">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Donation Module */}
          <div className="detail-sidebar">
            <div className="donate-card card" style={{ cursor: "default" }}>
              <h3 style={{ fontSize: "17px", marginBottom: "20px" }}>Make a Donation</h3>

              {txStatus && (
                <div className={`alert alert-${txStatus.type === "success" ? "success" : txStatus.type === "info" ? "info" : "error"}`} style={{ marginBottom: "16px" }}>
                  {txStatus.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span style={{ fontSize: "13px" }}>{txStatus.msg}</span>
                </div>
              )}

              {status !== 0 ? (
                <div className="alert alert-info">
                  <AlertCircle size={16} />
                  <span style={{ fontSize: "13px" }}>This campaign is {campaignStatusLabel(campaign.status).toLowerCase()} and no longer accepting donations.</span>
                </div>
              ) : (
                <form onSubmit={handleDonate}>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label">Amount (ETH)</label>
                    <div className="amount-input-wrap">
                      <input
                        className="input"
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="0.00"
                        value={donateAmount}
                        onChange={(e) => setDonateAmount(e.target.value)}
                        required
                      />
                      <div className="amount-presets">
                        {["0.01", "0.05", "0.1", "0.5"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            className="amount-preset"
                            onClick={() => setDonateAmount(v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label className="form-label">Message (optional)</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Leave a message of support..."
                      value={donateMsg}
                      onChange={(e) => setDonateMsg(e.target.value)}
                      maxLength={200}
                    />
                  </div>

                  {isConnected ? (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                      disabled={donating || !donateAmount}
                    >
                      {donating ? "Confirming..." : `Donate${donateAmount ? " " + donateAmount + " ETH" : ""}`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={connect}
                    >
                      Connect Wallet to Donate
                    </button>
                  )}

                  <p className="caption" style={{ marginTop: "12px", textAlign: "center" }}>
                    2% platform fee. All donations tracked on-chain.
                  </p>
                </form>
              )}

              {/* Campaign details */}
              <div className="divider" />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="detail-row">
                  <span className="caption">Charity address</span>
                  <span className="mono" style={{ fontSize: "12px" }}>{shortAddress(campaign.charity)}</span>
                </div>
                <div className="detail-row">
                  <span className="caption">Created</span>
                  <span style={{ fontSize: "13px" }}>{formatTimestamp(campaign.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="caption">Deadline</span>
                  <span style={{ fontSize: "13px" }}>{formatTimestamp(campaign.deadline)}</span>
                </div>
                <div className="detail-row">
                  <span className="caption">Withdrawn</span>
                  <span style={{ fontSize: "13px" }}>{formatEth(campaign.withdrawnAmount, 4)} ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
