import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X, Wallet, ChevronDown, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useWeb3 } from "../context/Web3Context";
import { LogoFull } from "./Logo";
import { shortAddress } from "../utils/contract";
import "./Navbar.css";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const {
    account,
    isConnecting,
    connect,
    disconnect,
    isCorrectNetwork,
    switchNetwork,
    networkName,
  } = useWeb3();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const navLinks = [
    { to: "/campaigns", label: "Campaigns" },
    { to: "/donor", label: "My Donations" },
    { to: "/charity", label: "Charity Portal" },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <LogoFull white />
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link${location.pathname.startsWith(link.to) ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {account && !isCorrectNetwork && (
            <button className="btn btn-secondary btn-sm" onClick={switchNetwork}>
              Switch to {networkName}
            </button>
          )}
          <button
            className="btn-icon"
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {account ? (
            <div className="account-dropdown" onClick={() => setAccountOpen((o) => !o)}>
              <div className="account-btn">
                <div className="account-dot" />
                <span className="mono">{shortAddress(account)}</span>
                <ChevronDown size={14} />
              </div>
              {accountOpen && (
                <div className="account-menu">
                  <div className="account-menu-addr">
                    <span className="caption">Connected wallet</span>
                    <span className="mono" style={{ fontSize: "12px" }}>{account}</span>
                  </div>
                  <div className="divider" style={{ margin: "8px 0" }} />
                  <Link to="/donor" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                    My Donations
                  </Link>
                  <Link to="/charity" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                    Charity Portal
                  </Link>
                  <div className="divider" style={{ margin: "8px 0" }} />
                  <button className="account-menu-item danger" onClick={disconnect}>
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={connect}
              disabled={isConnecting}
            >
              <Wallet size={15} />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}

          <button className="btn-icon mobile-menu-btn" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <div className="container">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`mobile-menu-link${location.pathname.startsWith(link.to) ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!account && (
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
                onClick={() => { connect(); setMenuOpen(false); }}
                disabled={isConnecting}
              >
                <Wallet size={15} />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
