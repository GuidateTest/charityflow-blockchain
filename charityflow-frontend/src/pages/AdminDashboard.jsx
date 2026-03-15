import { useState, useEffect } from "react";
import { Shield, CheckCircle, Wallet, DollarSign, Percent, UserCog } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatEth, shortAddress } from "../utils/contract";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { contract, account, isAdmin, connect } = useWeb3();
  const [pendingProofs, setPendingProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [status, setStatus] = useState(null);

  // Platform stats
  const [platformFees, setPlatformFees] = useState("0");
  const [feePercent, setFeePercent] = useState("2");

  // Verify charity form
  const [charityAddr, setCharityAddr] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [cancelCampaignId, setCancelCampaignId] = useState("");
  const [newFeeBp, setNewFeeBp] = useState("");
  const [newAdminAddr, setNewAdminAddr] = useState("");

  useEffect(() => {
    loadPendingProofs();
    loadPlatformStats();
  }, [contract]);

  async function loadPlatformStats() {
    if (!contract) return;
    try {
      const [fees, feeBp] = await Promise.all([
        contract.totalPlatformFees(),
        contract.platformFeePercent(),
      ]);
      setPlatformFees(fees.toString());
      setFeePercent((Number(feeBp) / 100).toFixed(1));
    } catch (e) {
      console.error("Failed to load platform stats:", e);
    }
  }

  async function loadPendingProofs() {
    if (!contract) {
      setPendingProofs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const total = await contract.getTotalCampaigns();
      const pending = [];
      for (let cid = 1; cid <= Number(total); cid++) {
        const proofIds = await contract.getCampaignProofs(cid);
        const campaign = await contract.getCampaign(cid);
        for (const pid of proofIds) {
          const proof = await contract.getProof(pid);
          if (!proof.verified) {
            pending.push({
              proofId: pid,
              campaignId: cid,
              campaignTitle: campaign.title,
              ...proof,
            });
          }
        }
      }
      setPendingProofs(pending);
    } catch (e) {
      console.error("Failed to load proofs:", e);
      setPendingProofs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyProof(proofId) {
    if (!contract || !isAdmin) return;
    setVerifying(proofId);
    setStatus(null);
    try {
      const tx = await contract.verifyProof(proofId);
      await tx.wait();
      setStatus({ type: "success", msg: `Proof #${proofId} verified.` });
      loadPendingProofs();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed" });
    } finally {
      setVerifying(null);
    }
  }

  async function handleVerifyCharity(e) {
    e.preventDefault();
    if (!contract || !isAdmin || !charityAddr.trim()) return;
    setVerifying("charity");
    setStatus(null);
    try {
      const tx = await contract.verifyCharity(charityAddr.trim());
      await tx.wait();
      setStatus({ type: "success", msg: `Charity ${shortAddress(charityAddr)} verified.` });
      setCharityAddr("");
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed" });
    } finally {
      setVerifying(null);
    }
  }

  async function handleVerifyCampaign(e) {
    e.preventDefault();
    if (!contract || !isAdmin || !campaignId.trim()) return;
    setVerifying("campaign");
    setStatus(null);
    try {
      const tx = await contract.verifyCampaign(Number(campaignId.trim()));
      await tx.wait();
      setStatus({ type: "success", msg: `Campaign #${campaignId} verified.` });
      setCampaignId("");
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed" });
    } finally {
      setVerifying(null);
    }
  }

  async function handleWithdrawFees() {
    if (!contract || !isAdmin) return;
    setVerifying("withdraw");
    setStatus(null);
    try {
      const tx = await contract.withdrawPlatformFees();
      await tx.wait();
      setStatus({ type: "success", msg: "Platform fees withdrawn." });
      loadPlatformStats();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed" });
    } finally {
      setVerifying(null);
    }
  }

  async function handleUpdateFee(e) {
    e.preventDefault();
    if (!contract || !isAdmin || !newFeeBp.trim()) return;
    const bp = Math.round(parseFloat(newFeeBp) * 100);
    if (bp < 0 || bp > 1000) {
      setStatus({ type: "error", msg: "Fee must be 0–10%" });
      return;
    }
    setVerifying("fee");
    setStatus(null);
    try {
      const tx = await contract.updateFeePercent(bp);
      await tx.wait();
      setStatus({ type: "success", msg: `Fee updated to ${newFeeBp}%.` });
      setNewFeeBp("");
      loadPlatformStats();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed" });
    } finally {
      setVerifying(null);
    }
  }

  async function handleTransferAdmin(e) {
    e.preventDefault();
    if (!contract || !isAdmin || !newAdminAddr.trim()) return;
    setVerifying("transfer");
    setStatus(null);
    try {
      const tx = await contract.transferAdmin(newAdminAddr.trim());
      await tx.wait();
      setStatus({ type: "success", msg: `Admin transferred to ${shortAddress(newAdminAddr)}.` });
      setNewAdminAddr("");
      window.location.reload();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed" });
    } finally {
      setVerifying(null);
    }
  }

  async function handleCancelCampaign(e) {
    e.preventDefault();
    if (!contract || !isAdmin || !cancelCampaignId.trim()) return;
    setVerifying("cancel");
    setStatus(null);
    try {
      const tx = await contract.cancelCampaign(Number(cancelCampaignId.trim()));
      await tx.wait();
      setStatus({ type: "success", msg: `Campaign #${cancelCampaignId} cancelled.` });
      setCancelCampaignId("");
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Failed" });
    } finally {
      setVerifying(null);
    }
  }

  if (!account) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="page-header">
            <h1><Shield size={28} /> Admin</h1>
            <p className="caption">Platform admin verification</p>
          </div>
          <div className="admin-connect-card card">
            <Wallet size={40} style={{ color: "var(--cf-muted)" }} />
            <h3>Connect your wallet</h3>
            <p className="caption">Connect MetaMask with the platform admin account to verify proofs and charities.</p>
            <button className="btn btn-primary" onClick={connect}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="page-header">
            <h1><Shield size={28} /> Admin</h1>
            <p className="caption">Platform admin verification</p>
          </div>
          <div className="admin-connect-card card">
            <Shield size={40} style={{ color: "var(--cf-muted)" }} />
            <h3>Access denied</h3>
            <p className="caption">Your wallet ({shortAddress(account)}) is not the platform admin. Only the deployer can verify proofs and charities.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="page-header">
          <h1><Shield size={28} /> Admin</h1>
          <p className="caption">Verify proofs and charities</p>
        </div>

        {status && (
          <div className={`admin-status ${status.type}`}>
            {status.type === "success" && <CheckCircle size={18} />}
            {status.msg}
          </div>
        )}

        {/* Pending proofs */}
        <section className="admin-section card">
          <h2>Pending proofs</h2>
          <p className="caption" style={{ marginBottom: 16 }}>Confirm legitimate spend by verifying submitted proofs.</p>
          {loading ? (
            <p className="caption">Loading...</p>
          ) : pendingProofs.length === 0 ? (
            <p className="caption" style={{ color: "var(--cf-muted)" }}>No pending proofs to verify.</p>
          ) : (
            <div className="pending-proofs">
              {pendingProofs.map((p) => (
                <div key={String(p.proofId)} className="proof-row">
                  <div className="proof-info">
                    <strong>#{p.proofId}</strong> — {p.title}
                    <span className="caption">Campaign: {p.campaignTitle}</span>
                    <span className="caption">{formatEth(p.amountSpent)} ETH</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleVerifyProof(p.proofId)}
                    disabled={verifying === p.proofId}
                  >
                    {verifying === p.proofId ? "Verifying..." : "Verify"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Verify charity */}
        <section className="admin-section card">
          <h2>Verify charity</h2>
          <form onSubmit={handleVerifyCharity} className="admin-form">
            <input
              className="input"
              placeholder="Charity address (0x...)"
              value={charityAddr}
              onChange={(e) => setCharityAddr(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={verifying === "charity"}>
              {verifying === "charity" ? "Verifying..." : "Verify Charity"}
            </button>
          </form>
        </section>

        {/* Verify campaign */}
        <section className="admin-section card">
          <h2>Verify campaign</h2>
          <form onSubmit={handleVerifyCampaign} className="admin-form">
            <input
              className="input"
              type="number"
              placeholder="Campaign ID"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={verifying === "campaign"}>
              {verifying === "campaign" ? "Verifying..." : "Verify Campaign"}
            </button>
          </form>
        </section>

        {/* Platform fees */}
        <section className="admin-section card">
          <h2><DollarSign size={18} /> Platform fees</h2>
          <p className="caption" style={{ marginBottom: 12 }}>
            Accumulated fees: <strong>{formatEth(platformFees, 4)} ETH</strong>
          </p>
          <button
            className="btn btn-primary"
            onClick={handleWithdrawFees}
            disabled={verifying === "withdraw" || BigInt(platformFees) === 0n}
          >
            {verifying === "withdraw" ? "Withdrawing..." : "Withdraw fees"}
          </button>
        </section>

        {/* Update fee */}
        <section className="admin-section card">
          <h2><Percent size={18} /> Update platform fee</h2>
          <p className="caption" style={{ marginBottom: 12 }}>
            Current fee: <strong>{feePercent}%</strong> (max 10%)
          </p>
          <form onSubmit={handleUpdateFee} className="admin-form">
            <input
              className="input"
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="New fee % (e.g. 2.5)"
              value={newFeeBp}
              onChange={(e) => setNewFeeBp(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={verifying === "fee"}>
              {verifying === "fee" ? "Updating..." : "Update fee"}
            </button>
          </form>
        </section>

        {/* Transfer admin */}
        <section className="admin-section card">
          <h2><UserCog size={18} /> Transfer admin</h2>
          <p className="caption" style={{ marginBottom: 12 }}>
            Transfer platform admin to a new address. This action is irreversible.
          </p>
          <form onSubmit={handleTransferAdmin} className="admin-form">
            <input
              className="input"
              placeholder="New admin address (0x...)"
              value={newAdminAddr}
              onChange={(e) => setNewAdminAddr(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={verifying === "transfer"}>
              {verifying === "transfer" ? "Transferring..." : "Transfer admin"}
            </button>
          </form>
        </section>

        {/* Cancel campaign */}
        <section className="admin-section card">
          <h2>Cancel campaign</h2>
          <p className="caption" style={{ marginBottom: 12 }}>
            Cancel an active campaign and enable donor refunds.
          </p>
          <form onSubmit={handleCancelCampaign} className="admin-form">
            <input
              className="input"
              type="number"
              placeholder="Campaign ID"
              value={cancelCampaignId}
              onChange={(e) => setCancelCampaignId(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={verifying === "cancel"}>
              {verifying === "cancel" ? "Cancelling..." : "Cancel campaign"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
