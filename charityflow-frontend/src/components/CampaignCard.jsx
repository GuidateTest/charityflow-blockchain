import { Link } from "react-router-dom";
import { Shield, Clock, Users } from "lucide-react";
import {
  formatEth,
  campaignProgress,
  campaignStatusLabel,
  daysLeft,
  shortAddress,
} from "../utils/contract";
import { ipfsUrl } from "../utils/ipfs";

const categoryColors = {
  Health: { bg: "rgba(16,185,129,0.1)", color: "#10B981" },
  Education: { bg: "rgba(99,102,241,0.1)", color: "#6366F1" },
  Environment: { bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
  Humanitarian: { bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
  default: { bg: "rgba(100,116,139,0.1)", color: "#64748B" },
};

export default function CampaignCard({ campaign }) {
  const progress = campaignProgress(campaign.raisedAmount, campaign.goalAmount);
  const days = daysLeft(campaign.deadline);
  const status = Number(campaign.status);
  const catStyle =
    categoryColors[campaign.category] || categoryColors.default;

  const coverUrl = campaign.imageHash ? ipfsUrl(campaign.imageHash) : null;

  return (
    <Link to={`/campaigns/${Number(campaign.id)}`} className="campaign-card-link">
      <div className="campaign-card card">
        {coverUrl && (
          <div className="campaign-card-cover" style={{ overflow: "hidden", borderRadius: "12px 12px 0 0", margin: "-1px -1px 0 -1px" }}>
            <img
              src={coverUrl}
              alt=""
              style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        )}
        {/* Header */}
        <div className="campaign-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              className="badge"
              style={{ background: catStyle.bg, color: catStyle.color, border: "none" }}
            >
              {campaign.category}
            </span>
            {campaign.verified && (
              <span className="badge badge-verified-glow">
                <Shield size={10} />
                Verified
              </span>
            )}
          </div>
          <span
            className={`badge badge-${["active", "completed", "cancelled"][status] || "active"}`}
          >
            {campaignStatusLabel(campaign.status)}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            lineHeight: "22px",
            marginTop: "12px",
            marginBottom: "6px",
            color: "var(--cf-text)",
          }}
        >
          {campaign.title}
        </h3>

        <p
          className="caption"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          {campaign.description}
        </p>

        {/* Progress */}
        <div style={{ marginBottom: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--cf-teal-1)" }}>
              {formatEth(campaign.raisedAmount, 3)} ETH raised
            </span>
            <span className="caption">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ marginTop: "4px" }}>
            <span className="caption">Goal: {formatEth(campaign.goalAmount, 2)} ETH</span>
          </div>
        </div>

        {/* Footer stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "1px solid var(--cf-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="caption">
            <Users size={13} />
            <span>{Number(campaign.donorCount)} donors</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="caption">
            <Clock size={13} />
            <span>{status === 0 ? (days > 0 ? `${days}d left` : "Expired") : campaignStatusLabel(campaign.status)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
