import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, Activity, ExternalLink, ChevronRight, AlertCircle } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  MOCK_CAMPAIGNS, MOCK_DONATIONS,
  NETWORK_NAME,
  fetchActivityFeed,
  formatEth,
  formatTimestamp,
  shortAddress,
  campaignStatusLabel,
  campaignProgress,
  txExplorerUrl,
} from "../utils/contract";
import "./DonorDashboard.css";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card stat-card" style={{ cursor: "default" }}>
      <div className="stat-card-icon">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="caption" style={{ marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

export default function DonorDashboard() {
  const { contract, account, isConnected, connect, isCorrectNetwork, switchNetwork } = useWeb3();
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState({});
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonorData();
  }, [account, contract]);

  async function loadDonorData() {
    if (!isConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (contract && account) {
        const donationIds = await contract.getDonorDonations(account);
        const donationList = await Promise.all(donationIds.map((id) => contract.getDonation(id)));
        setDonations(donationList);

        // Load campaigns for each donation
        const campMap = {};
        for (const d of donationList) {
          const cid = String(d.campaignId);
          if (!campMap[cid]) {
            campMap[cid] = await contract.getCampaign(d.campaignId);
          }
        }
        setCampaigns(campMap);

        setActivityLoading(true);
        const campaignIds = Object.keys(campMap).map((id) => Number(id));
        const feed = await fetchActivityFeed(contract, {
          account,
          campaignIds,
          limit: 20,
        });
        setActivity(feed);
      } else {
        // Demo
        setDonations(MOCK_DONATIONS);
        const campMap = {};
        for (const c of MOCK_CAMPAIGNS) {
          campMap[String(c.id)] = c;
        }
        setCampaigns(campMap);
        setActivity([]);
      }
    } catch (e) {
      console.error(e);
      setDonations(MOCK_DONATIONS);
      const campMap = {};
      MOCK_CAMPAIGNS.forEach((c) => { campMap[String(c.id)] = c; });
      setCampaigns(campMap);
      setActivity([]);
    } finally {
      setActivityLoading(false);
      setLoading(false);
    }
  }

  const totalDonated = donations.reduce(
    (sum, d) => sum + (d.refunded ? 0n : BigInt(d.amount)),
    0n
  );
  const activeDonations = donations.filter((d) => {
    const c = campaigns[String(d.campaignId)];
    return c && Number(c.status) === 0;
  });
  const verifiedImpacts = Object.values(campaigns).filter(
    (c) => c && c.verified && Number(c.status) === 1
  ).length;

  if (!isConnected) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <Wallet size={52} strokeWidth={1} style={{ color: "var(--cf-text-muted)" }} />
        <h2 style={{ marginTop: "16px", marginBottom: "8px" }}>Connect Your Wallet</h2>
        <p className="caption">Connect your MetaMask wallet to view your donation history and track fund usage.</p>
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
              <h1 style={{ marginBottom: "4px" }}>Donor Dashboard</h1>
              <span className="mono caption">{shortAddress(account)}</span>
            </div>
            <Link to="/campaigns" className="btn btn-primary btn-sm">
              Donate More
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        {!isCorrectNetwork && (
          <div className="alert alert-info" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: "13px" }}>
              You are connected to the wrong network. Switch to {NETWORK_NAME} to make real testnet transactions.
            </span>
            <button className="btn btn-secondary btn-sm" onClick={switchNetwork}>
              Switch Network
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <StatCard
            icon={TrendingUp}
            label="Total Donated"
            value={`${formatEth(totalDonated, 4)} ETH`}
            sub="Across all campaigns"
          />
          <StatCard
            icon={Activity}
            label="Active Campaigns"
            value={activeDonations.length}
            sub="Currently donating to"
          />
          <StatCard
            icon={Wallet}
            label="Verified Impacts"
            value={verifiedImpacts}
            sub="Campaigns with confirmed outcomes"
          />
        </div>

        <div style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>On-Chain Activity Log</h2>
          {activityLoading ? (
            <div className="skeleton" style={{ height: "120px" }} />
          ) : activity.length === 0 ? (
            <div className="card" style={{ cursor: "default" }}>
              <p className="caption">No on-chain events found yet for this wallet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                      <span className="mono caption">{shortAddress(item.txHash)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donations History */}
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Donation History</h2>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "80px" }} />)}
            </div>
          ) : donations.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px", cursor: "default" }}>
              <Activity size={40} strokeWidth={1} style={{ color: "var(--cf-text-muted)" }} />
              <h3 style={{ marginTop: "16px", marginBottom: "8px" }}>No donations yet</h3>
              <p className="caption">Start donating to transparent campaigns and track every wei.</p>
              <Link to="/campaigns" className="btn btn-primary btn-sm" style={{ marginTop: "16px" }}>
                Browse Campaigns
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {donations.map((donation) => {
                const c = campaigns[String(donation.campaignId)];
                const progress = c ? campaignProgress(c.raisedAmount, c.goalAmount) : 0;
                return (
                  <div key={String(donation.id)} className="card donation-row" style={{ cursor: "default" }}>
                    <div className="donation-row-main">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px" }}>
                          {c ? c.title : `Campaign #${donation.campaignId}`}
                        </div>
                        <div className="caption">{formatTimestamp(donation.timestamp)}</div>
                        {donation.message && (
                          <div className="caption" style={{ marginTop: "4px", fontStyle: "italic" }}>
                            "{donation.message}"
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", align: "flex-end", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                        <div style={{ fontWeight: 700, color: "var(--cf-teal-1)", fontSize: "16px" }}>
                          {formatEth(donation.amount, 4)} ETH
                        </div>
                        {donation.refunded && <span className="badge badge-cancelled">Refunded</span>}
                      </div>
                    </div>

                    {c && (
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span className="caption">Campaign progress: {progress}%</span>
                          <span className={`badge badge-${["active","completed","cancelled"][Number(c.status)]}`} style={{ fontSize: "11px" }}>
                            {campaignStatusLabel(c.status)}
                          </span>
                        </div>
                        <div className="progress-bar" style={{ height: "4px" }}>
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                      <Link
                        to={`/campaigns/${donation.campaignId}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "12px" }}
                      >
                        <Activity size={13} /> Track Fund Usage
                      </Link>
                      <Link
                        to={`/campaigns/${donation.campaignId}`}
                        className="btn btn-sm"
                        style={{ fontSize: "12px", color: "var(--cf-text-muted)", border: "1px solid var(--cf-border)", borderRadius: "999px", padding: "7px 14px", background: "transparent" }}
                      >
                        Campaign Details <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
