import { CheckCircle, Circle, ExternalLink } from "lucide-react";
import { formatEth, formatTimestamp, shortHash, txExplorerUrl } from "../utils/contract";
import { ipfsUrl } from "../utils/ipfs";
import "./FundFlowTimeline.css";

const FLOW_STEPS = [
  { key: "donated", label: "Donated", desc: "Donor sends ETH to campaign wallet" },
  { key: "held", label: "Held in Campaign Wallet", desc: "Funds secured in smart contract escrow" },
  { key: "disbursed", label: "Disbursed", desc: "Charity withdraws for approved purpose" },
  { key: "spent", label: "Spent on Item/Service", desc: "Funds used for declared purpose" },
  { key: "proof", label: "Proof Uploaded", desc: "Receipt/photo attached on-chain" },
  { key: "verified", label: "Verified", desc: "Platform admin confirms legitimate spend" },
];

function StepNode({ step, index, status, txHash, timestamp, amount, evidence }) {
  const isDone = status === "done";
  const isPending = status === "pending";
  const isCurrent = status === "current";

  return (
    <div className={`flow-step${isDone ? " done" : ""}${isCurrent ? " current" : ""}`}>
      {/* Connector line */}
      {index < FLOW_STEPS.length - 1 && (
        <div className={`flow-connector${isDone ? " done" : ""}`} />
      )}

      {/* Node */}
      <div className={`flow-node${isDone ? " done" : ""}${isCurrent ? " current" : ""}`}>
        {isDone ? (
          <CheckCircle size={18} strokeWidth={2} />
        ) : (
          <Circle size={18} strokeWidth={1.5} />
        )}
      </div>

      {/* Content */}
      <div className="flow-content">
        <div className="flow-label">
          {step.label}
          {isDone && <span className="badge badge-verified-glow" style={{ marginLeft: "8px", fontSize: "11px" }}>Confirmed</span>}
        </div>
        <div className="caption">{step.desc}</div>

        {isDone && (
          <div className="flow-meta">
            {amount && (
              <span className="mono" style={{ color: "var(--cf-teal-1)", fontSize: "12px" }}>
                {formatEth(amount, 4)} ETH
              </span>
            )}
            {timestamp && (
              <span className="caption">{formatTimestamp(timestamp)}</span>
            )}
            {txHash && (
              <a
                href={txExplorerUrl(txHash) || `#`}
                target="_blank"
                rel="noreferrer"
                className="flow-tx-link"
              >
                <span className="mono">{shortHash(txHash)}</span>
                <ExternalLink size={11} />
              </a>
            )}
            {evidence && (
              <a
                href={ipfsUrl(evidence)}
                target="_blank"
                rel="noreferrer"
                className="caption"
                style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--cf-teal-1)" }}
              >
                Proof: <span className="mono">{shortHash(evidence)}</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FundFlowTimeline({ donation, withdrawals = [], proofs = [] }) {
  // Determine which steps are complete based on available data
  const hasDonation = !!donation;
  const hasWithdrawal = withdrawals.length > 0;
  const hasProof = proofs.length > 0;
  const hasVerifiedProof = proofs.some((p) => p.verified);

  const statuses = [
    hasDonation ? "done" : "pending",
    hasDonation ? "done" : "pending",
    hasWithdrawal ? "done" : hasDonation ? "current" : "pending",
    hasWithdrawal ? "done" : "pending",
    hasProof ? "done" : hasWithdrawal ? "current" : "pending",
    hasVerifiedProof ? "done" : hasProof ? "current" : "pending",
  ];

  const stepData = [
    {
      amount: donation?.amount,
      timestamp: donation?.timestamp,
      txHash: null,
    },
    {
      amount: donation?.amount,
      timestamp: donation?.timestamp,
      txHash: null,
    },
    {
      amount: withdrawals[0]?.amount,
      timestamp: withdrawals[0]?.timestamp,
      txHash: null,
      evidence: withdrawals[0]?.proofHash,
    },
    {
      amount: withdrawals[0]?.amount,
      timestamp: withdrawals[0]?.timestamp,
    },
    {
      timestamp: proofs[0]?.timestamp,
      evidence: proofs[0]?.fileHash,
    },
    {
      timestamp: proofs.find((p) => p.verified)?.timestamp,
    },
  ];

  return (
    <div className="fund-flow-timeline">
      {FLOW_STEPS.map((step, i) => (
        <StepNode
          key={step.key}
          step={step}
          index={i}
          status={statuses[i]}
          {...stepData[i]}
        />
      ))}
    </div>
  );
}
