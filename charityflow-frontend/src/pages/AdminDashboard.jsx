import { useState, useEffect } from "react";
import { Shield, CheckCircle, Wallet } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatEth, shortAddress } from "../utils/contract";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { contract, account, isAdmin, connect } = useWeb3();
  const [pendingProofs, setPendingProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [status, setStatus] = useState(null);

  // Verify charity form
  const [charityAddr, setCharityAddr] = useState("");
  const [campaignId, setCampaignId] = useState("");

  useEffect(() => {
    loadPendingProofs();
  }, [contract]);

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
      </div>
    </div>
  );
}
