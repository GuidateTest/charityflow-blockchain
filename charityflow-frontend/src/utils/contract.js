import { ethers } from "ethers";
import CharityDonationABI from "./CharityDonationABI.json";

// Contract address per chain — anyone connecting gets the right one automatically
const HARDHAT_CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const SEPOLIA_CONTRACT = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const CONTRACT_BY_CHAIN = {
  31337: HARDHAT_CONTRACT,
  11155111: SEPOLIA_CONTRACT || HARDHAT_CONTRACT, // fallback for demo
};

export const NETWORKS = {
  31337: {
    chainName: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "",
  },
  11155111: {
    chainName: "Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
  },
};

export function getContractAddress(chainId) {
  const id = chainId ? Number(chainId) : 11155111;
  return CONTRACT_BY_CHAIN[id] || CONTRACT_BY_CHAIN[11155111] || "";
}

export const NETWORK_CHAIN_ID = 11155111;
export const NETWORK_NAME = "Sepolia Testnet";
export const READ_RPC_URL = "https://rpc.sepolia.org";
export const BLOCK_EXPLORER_BASE_URL = "https://sepolia.etherscan.io";

export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Read-only fallback provider
  return new ethers.JsonRpcProvider(READ_RPC_URL);
}

export async function getSigner() {
  const provider = getProvider();
  if (provider instanceof ethers.BrowserProvider) {
    return provider.getSigner();
  }
  throw new Error("No wallet connected");
}

export function getContract(signerOrProvider, chainId) {
  const address = getContractAddress(chainId);
  if (!address || !ethers.isAddress(address)) {
    throw new Error(
      "No contract for this network. Deploy to Sepolia and set VITE_CONTRACT_ADDRESS in .env."
    );
  }
  return new ethers.Contract(address, CharityDonationABI.abi, signerOrProvider);
}

export async function getReadContract() {
  const provider = getProvider();
  return getContract(provider);
}

export async function getWriteContract() {
  const signer = await getSigner();
  return getContract(signer);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatEth(wei, decimals = 4) {
  if (!wei) return "0";
  return parseFloat(ethers.formatEther(wei)).toFixed(decimals);
}

export function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function shortHash(hash) {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function txExplorerUrl(txHash) {
  if (!BLOCK_EXPLORER_BASE_URL || !txHash) return "";
  return `${BLOCK_EXPLORER_BASE_URL}/tx/${txHash}`;
}

export function formatTimestamp(unixTs) {
  if (!unixTs) return "-";
  const ts = typeof unixTs === "bigint" ? Number(unixTs) : unixTs;
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function campaignStatusLabel(status) {
  const map = { 0: "Active", 1: "Completed", 2: "Cancelled" };
  return map[Number(status)] ?? "Unknown";
}

export function campaignProgress(raised, goal) {
  if (!goal || goal === 0n) return 0;
  const r = typeof raised === "bigint" ? raised : BigInt(raised);
  const g = typeof goal === "bigint" ? goal : BigInt(goal);
  if (g === 0n) return 0;
  return Math.min(100, Number((r * 100n) / g));
}

export function daysLeft(deadlineUnix) {
  const ts = typeof deadlineUnix === "bigint" ? Number(deadlineUnix) : deadlineUnix;
  const diff = ts * 1000 - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function parseEthersError(error, fallback = "Transaction failed.") {
  if (!error) return fallback;
  return (
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.message ||
    fallback
  );
}

async function queryFilterSafe(contract, filter, fromBlock, toBlock) {
  try {
    return await contract.queryFilter(filter, fromBlock, toBlock);
  } catch (error) {
    console.error("Event query failed:", error);
    return [];
  }
}

export async function fetchActivityFeed(
  contract,
  { account = null, campaignIds = [], limit = 25 } = {}
) {
  if (!contract) return [];

  const provider = contract.runner?.provider || getProvider();
  const latestBlock = await provider.getBlockNumber();
  const deploymentBlock = Number(import.meta.env.VITE_DEPLOYMENT_BLOCK || 0);
  const lookbackBlocks = Number(import.meta.env.VITE_ACTIVITY_LOOKBACK_BLOCKS || 50000);
  const fromBlock = deploymentBlock > 0 ? deploymentBlock : Math.max(0, latestBlock - lookbackBlocks);

  const accountFilter = account || null;
  const ids = Array.from(
    new Set(campaignIds.filter((id) => id !== undefined && id !== null).map((id) => Number(id)))
  );

  const queries = [];
  if (accountFilter) {
    queries.push(queryFilterSafe(contract, contract.filters.CampaignCreated(null, accountFilter), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.DonationMade(null, null, accountFilter), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.RefundIssued(null, accountFilter), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.ProofSubmitted(null, null, accountFilter), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.WithdrawalMade(null, null, accountFilter), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.ImpactReportPosted(null, null, accountFilter), fromBlock, latestBlock));
  }

  for (const campaignId of ids) {
    queries.push(queryFilterSafe(contract, contract.filters.DonationMade(null, campaignId), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.CampaignCompleted(campaignId), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.CampaignCancelled(campaignId), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.WithdrawalMade(null, campaignId), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.ProofSubmitted(null, campaignId), fromBlock, latestBlock));
    queries.push(queryFilterSafe(contract, contract.filters.ImpactReportPosted(null, campaignId), fromBlock, latestBlock));
  }

  const logs = (await Promise.all(queries)).flat();
  const seen = new Set();
  const deduped = logs.filter((log) => {
    const key = `${log.transactionHash}-${log.index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const events = deduped
    .map((log) => {
      const eventName = log.fragment?.name || "Unknown";
      const args = log.args || {};
      let title = eventName;
      let detail = "";
      let campaignId = null;
      let amountWei = null;

      if (eventName === "CampaignCreated") {
        campaignId = Number(args.campaignId);
        amountWei = args.goalAmount;
        title = "Campaign created";
        detail = `${args.title}`;
      } else if (eventName === "DonationMade") {
        campaignId = Number(args.campaignId);
        amountWei = args.amount;
        title = "Donation received";
        detail = `Campaign #${campaignId} received ${formatEth(args.amount)} ETH`;
      } else if (eventName === "WithdrawalMade") {
        campaignId = Number(args.campaignId);
        amountWei = args.amount;
        title = "Funds withdrawn";
        detail = `${formatEth(args.amount)} ETH used for ${args.purpose}`;
      } else if (eventName === "ProofSubmitted") {
        campaignId = Number(args.campaignId);
        amountWei = args.amountSpent;
        title = "Proof submitted";
        detail = `Campaign #${campaignId} proof uploaded`;
      } else if (eventName === "ImpactReportPosted") {
        campaignId = Number(args.campaignId);
        title = "Impact report posted";
        detail = `Campaign #${campaignId} published an update`;
      } else if (eventName === "CampaignCompleted") {
        campaignId = Number(args.campaignId);
        title = "Campaign completed";
        detail = `Campaign #${campaignId} reached its goal`;
      } else if (eventName === "CampaignCancelled") {
        campaignId = Number(args.campaignId);
        title = "Campaign cancelled";
        detail = `Campaign #${campaignId} was cancelled`;
      } else if (eventName === "RefundIssued") {
        amountWei = args.amount;
        title = "Refund issued";
        detail = `${formatEth(args.amount)} ETH refunded`;
      }

      return {
        id: `${log.transactionHash}-${log.index}`,
        eventName,
        title,
        detail,
        amountWei,
        campaignId,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      };
    })
    .sort((a, b) => (b.blockNumber === a.blockNumber ? 0 : b.blockNumber - a.blockNumber))
    .slice(0, limit);

  return events;
}

// ─── Mock / demo data (for UI when contract is not deployed yet) ──────────────

export const MOCK_CAMPAIGNS = [
  {
    id: 1n,
    charity: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    title: "Clean Water for Rural Communities",
    description:
      "We are working to install water purification systems across 10 rural villages in need. Every donation directly funds water pumps, filtration units, and infrastructure.",
    category: "Health",
    imageHash: "",
    goalAmount: ethers.parseEther("5"),
    raisedAmount: ethers.parseEther("2.8"),
    withdrawnAmount: ethers.parseEther("0.8"),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 24 * 3600),
    status: 0n,
    verified: true,
    donorCount: 38n,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 10 * 24 * 3600),
  },
  {
    id: 2n,
    charity: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    title: "Girls Education Fund 2025",
    description:
      "Providing school supplies, uniforms, and tuition support for 200 girls from underprivileged families to complete secondary education.",
    category: "Education",
    imageHash: "",
    goalAmount: ethers.parseEther("3"),
    raisedAmount: ethers.parseEther("1.2"),
    withdrawnAmount: 0n,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 45 * 24 * 3600),
    status: 0n,
    verified: true,
    donorCount: 22n,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 5 * 24 * 3600),
  },
  {
    id: 3n,
    charity: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    title: "Reforestation: Plant 10,000 Trees",
    description:
      "Our team of volunteers will plant 10,000 native trees across deforested zones. Blockchain-tracked progress ensures every donor sees exactly where their trees are planted.",
    category: "Environment",
    imageHash: "",
    goalAmount: ethers.parseEther("8"),
    raisedAmount: ethers.parseEther("3.5"),
    withdrawnAmount: ethers.parseEther("1.0"),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 90 * 24 * 3600),
    status: 0n,
    verified: false,
    donorCount: 54n,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 20 * 24 * 3600),
  },
  {
    id: 4n,
    charity: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    title: "Emergency Food Relief - Crisis Response",
    description:
      "Immediate food packages for 500 families affected by recent flooding. Funds are disbursed within 48 hours of receipt — all transactions visible on-chain.",
    category: "Humanitarian",
    imageHash: "",
    goalAmount: ethers.parseEther("2"),
    raisedAmount: ethers.parseEther("2"),
    withdrawnAmount: ethers.parseEther("1.8"),
    deadline: BigInt(Math.floor(Date.now() / 1000) - 5 * 24 * 3600),
    status: 1n,
    verified: true,
    donorCount: 87n,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 25 * 24 * 3600),
  },
];

export const MOCK_DONATIONS = [
  {
    id: 1n,
    campaignId: 1n,
    donor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    amount: ethers.parseEther("1.47"),
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 8 * 24 * 3600),
    message: "Happy to help!",
    refunded: false,
  },
  {
    id: 2n,
    campaignId: 2n,
    donor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    amount: ethers.parseEther("0.98"),
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 3 * 24 * 3600),
    message: "Education is key",
    refunded: false,
  },
  {
    id: 3n,
    campaignId: 3n,
    donor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    amount: ethers.parseEther("1.96"),
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 15 * 24 * 3600),
    message: "Go green!",
    refunded: false,
  },
];

export const MOCK_PROOFS = [
  {
    id: 1n,
    campaignId: 1n,
    submittedBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    title: "Water pump installation at Village A",
    description:
      "Successfully installed 2 water pumps at Village A serving approximately 150 families.",
    fileHash: "QmPumpInstallationProofHash",
    amountSpent: ethers.parseEther("0.8"),
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 5 * 24 * 3600),
    verified: true,
  },
  {
    id: 2n,
    campaignId: 1n,
    submittedBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    title: "Filtration system delivery - Invoice",
    description:
      "Received and installed 3 filtration units. Attached invoice from supplier Aquatech Ltd.",
    fileHash: "QmFiltrationInvoiceHash",
    amountSpent: ethers.parseEther("0.4"),
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 2 * 24 * 3600),
    verified: false,
  },
];

export const MOCK_WITHDRAWALS = [
  {
    id: 1n,
    campaignId: 1n,
    recipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    amount: ethers.parseEther("0.8"),
    purpose: "Payment to Aquatech Ltd for pump installation",
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 4 * 24 * 3600),
    proofHash: "QmInvoiceHash1",
  },
];
