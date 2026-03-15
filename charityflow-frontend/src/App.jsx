import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import CampaignList from "./pages/CampaignList";
import CampaignDetail from "./pages/CampaignDetail";
import DonorDashboard from "./pages/DonorDashboard";
import CharityDashboard from "./pages/CharityDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span style={{ fontWeight: 600, color: "var(--cf-text)" }}>CharityFlow</span>
          <span className="caption">Transparent giving, verified on-chain.</span>
        </div>
        <div className="footer-links">
          <a href="https://hardhat.org" target="_blank" rel="noreferrer" className="caption footer-link">
            Hardhat
          </a>
          <a href="https://metamask.io" target="_blank" rel="noreferrer" className="caption footer-link">
            MetaMask
          </a>
          <a href="https://ethers.org" target="_blank" rel="noreferrer" className="caption footer-link">
            Ethers.js
          </a>
        </div>
        <div className="caption" style={{ color: "var(--cf-text-muted)" }}>
          MDT915 Blockchain Project · 2026
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <BrowserRouter>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/donor" element={<DonorDashboard />} />
              <Route path="/charity" element={<CharityDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </Web3Provider>
    </ThemeProvider>
  );
}
