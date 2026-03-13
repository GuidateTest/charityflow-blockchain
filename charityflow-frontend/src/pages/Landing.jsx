import { Link } from "react-router-dom";
import { ArrowRight, Shield, Search, BarChart3, Lock, Globe, Zap, ChevronRight } from "lucide-react";
import { LogoIcon } from "../components/Logo";
import "./Landing.css";

function StatBadge({ value, label }) {
  return (
    <div className="stat-badge">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="feature-card card">
      <div className="feature-icon">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "8px" }}>{title}</h3>
      <p className="caption" style={{ lineHeight: "20px" }}>{desc}</p>
    </div>
  );
}

function HowItWorksStep({ number, title, desc }) {
  return (
    <div className="how-step">
      <div className="how-step-number">{number}</div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{title}</div>
        <p className="caption">{desc}</p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-content">
          <div className="hero-badge">
            <div className="node-dot" />
            <span>Powered by Ethereum Smart Contracts</span>
          </div>

          <h1 className="hero-title">
            Every Donation,
            <br />
            <span className="gradient-text">Fully Traceable.</span>
          </h1>

          <p className="hero-subtitle">
            CharityFlow brings radical transparency to charitable giving. Track exactly how your
            funds move from donation to impact, verified on-chain — every step, every wei.
          </p>

          <div className="hero-actions">
            <Link to="/campaigns" className="btn btn-primary btn-lg">
              Start Donating
              <ArrowRight size={18} />
            </Link>
            <Link to="/campaigns" className="btn btn-secondary btn-lg">
              Explore Campaigns
            </Link>
          </div>

          {/* Stats row */}
          <div className="hero-stats">
            <StatBadge value="100%" label="On-chain transparency" />
            <div className="stat-divider" />
            <StatBadge value="41" label="Smart contract tests" />
            <div className="stat-divider" />
            <StatBadge value="0" label="Hidden fees" />
            <div className="stat-divider" />
            <StatBadge value="2%" label="Platform fee" />
          </div>
        </div>
      </section>

      {/* ── Feature Cards ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Why CharityFlow?</h2>
            <p className="caption" style={{ fontSize: "16px", marginTop: "8px" }}>
              Traditional charity platforms hide the money trail. We make every transaction public and verifiable.
            </p>
          </div>
          <div className="grid-3">
            <FeatureCard
              icon={Search}
              title="Track Funds"
              desc="Follow every wei from your wallet to its final destination. Real-time fund flow explorer shows exactly where money is at every stage."
            />
            <FeatureCard
              icon={Shield}
              title="Proof of Work"
              desc="Charities upload verified receipts, photos, and invoices attached directly to on-chain withdrawal records. Nothing is hidden."
            />
            <FeatureCard
              icon={BarChart3}
              title="Impact Reports"
              desc="Periodic on-chain impact reports with media attachments show what was accomplished. Donors see measurable outcomes."
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2>How Transparency Works</h2>
            <p className="caption" style={{ fontSize: "15px", marginTop: "8px" }}>
              Every donation follows a transparent, verifiable journey on the blockchain.
            </p>
          </div>
          <div className="how-grid">
            <div className="how-steps">
              <HowItWorksStep
                number="01"
                title="Donor Sends ETH"
                desc="Your donation is sent directly to the campaign smart contract. Funds are held in escrow — never in a centralized wallet."
              />
              <HowItWorksStep
                number="02"
                title="Charity Requests Withdrawal"
                desc="Charities must declare the purpose of every withdrawal and attach proof of purchase before funds are released."
              />
              <HowItWorksStep
                number="03"
                title="Proof Verified On-Chain"
                desc="Platform admin reviews and verifies submitted proofs. Verified steps receive a special on-chain certification mark."
              />
              <HowItWorksStep
                number="04"
                title="Impact Report Posted"
                desc="Charities post regular impact reports with media attachments. All updates are permanently stored on the blockchain."
              />
            </div>
            <div className="how-visual">
              <div className="flow-preview-card card">
                <div style={{ marginBottom: "16px", fontWeight: 600, fontSize: "14px" }}>Fund Flow Preview</div>
                {["Donated", "Held in Smart Contract", "Disbursed", "Spent", "Proof Uploaded", "Verified"].map(
                  (step, i) => (
                    <div key={step} className="flow-preview-step">
                      <div
                        className="flow-preview-node"
                        style={
                          i <= 2
                            ? {
                                borderColor: "var(--cf-teal-1)",
                                background: "rgba(0,194,168,0.12)",
                                color: "var(--cf-teal-1)",
                              }
                            : {}
                        }
                      />
                      {i < 5 && <div className={`flow-preview-line${i <= 1 ? " done" : ""}`} />}
                      <span
                        style={{
                          fontSize: "13px",
                          color: i <= 2 ? "var(--cf-text)" : "var(--cf-text-muted)",
                          fontWeight: i <= 2 ? 500 : 400,
                        }}
                      >
                        {step}
                        {i <= 2 && (
                          <span
                            className="badge badge-verified-glow"
                            style={{ marginLeft: "8px", fontSize: "10px" }}
                          >
                            Done
                          </span>
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Additional Features ────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Built for Trust</h2>
          </div>
          <div className="grid-3">
            <FeatureCard icon={Lock} title="Non-Custodial" desc="Funds are held in smart contracts, not company wallets. Only the charity can withdraw — and every withdrawal is recorded." />
            <FeatureCard icon={Globe} title="Open Source" desc="All smart contracts are open source and auditable. Anyone can verify the code that holds the funds." />
            <FeatureCard icon={Zap} title="Instant Settlement" desc="No waiting for bank transfers. Crypto donations settle in seconds on Ethereum with full on-chain proof." />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="container cta-content">
          <LogoIcon size={52} />
          <h2 style={{ marginTop: "20px" }}>Ready to donate with confidence?</h2>
          <p className="caption" style={{ fontSize: "15px", marginTop: "8px", marginBottom: "28px" }}>
            Join donors who demand transparency. Every donation tracked, every impact verified.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/campaigns" className="btn btn-primary btn-lg">
              Browse Campaigns <ArrowRight size={18} />
            </Link>
            <Link to="/charity" className="btn btn-secondary btn-lg">
              Create a Campaign
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
