import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  getContract,
  getContractAddress,
  NETWORKS,
  NETWORK_CHAIN_ID,
  NETWORK_NAME,
  READ_RPC_URL,
  BLOCK_EXPLORER_BASE_URL,
} from "../utils/contract";

const Web3Context = createContext(null);

const SUPPORTED_CHAINS = [31337, 11155111]; // Hardhat local, Sepolia

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [platformAdmin, setPlatformAdmin] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const initContract = useCallback((signerOrProvider, chainIdForContract) => {
    try {
      const c = getContract(signerOrProvider, chainIdForContract ?? 11155111);
      setContract(c);
    } catch (e) {
      console.error("Contract init error:", e);
      setContract(null);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask to use CharityFlow.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await _provider.send("eth_requestAccounts", []);
      const _signer = await _provider.getSigner();
      const network = await _provider.getNetwork();

      // User explicitly clicked Connect — clear any prior disconnect flag
      localStorage.removeItem("cf-wallet-disconnected");

      const _chainId = Number(network.chainId);
      setProvider(_provider);
      setSigner(_signer);
      setAccount(accounts[0]);
      setChainId(_chainId);
      initContract(_signer, _chainId);
    } catch (e) {
      setError(e.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [initContract]);

  const disconnect = useCallback(() => {
    localStorage.setItem("cf-wallet-disconnected", "1");
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setContract(null);
    setChainId(null);
    setPlatformAdmin(null);
    try {
      const fallback = new ethers.JsonRpcProvider(READ_RPC_URL);
      initContract(fallback, 11155111);
    } catch (_) {}
  }, [initContract]);

  useEffect(() => {
    if (!contract) {
      setPlatformAdmin(null);
      return;
    }
    contract.platformAdmin().then(setPlatformAdmin).catch(() => setPlatformAdmin(null));
  }, [contract]);

  // Always init read-only contract for Sepolia so campaigns load without wallet.
  // Auto-reconnect on page load if already authorized AND user hasn't disconnected.
  useEffect(() => {
    const initReadOnly = () => {
      try {
        const fallback = new ethers.JsonRpcProvider(READ_RPC_URL);
        initContract(fallback, 11155111);
      } catch (_) {}
    };

    if (!window.ethereum) {
      initReadOnly();
      return;
    }
    const userDisconnected = localStorage.getItem("cf-wallet-disconnected") === "1";
    if (userDisconnected) {
      initReadOnly();
      return;
    }
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts.length > 0) {
          const _provider = new ethers.BrowserProvider(window.ethereum);
          const _signer = await _provider.getSigner();
          const network = await _provider.getNetwork();
          const _chainId = Number(network.chainId);
          setProvider(_provider);
          setSigner(_signer);
          setAccount(accounts[0]);
          setChainId(_chainId);
          initContract(_signer, _chainId);
        } else {
          initReadOnly();
        }
      })
      .catch(() => initReadOnly());
  }, [initContract]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        // MetaMask switched to a different account — treat this as
        // an intentional reconnect and clear the disconnected flag.
        localStorage.removeItem("cf-wallet-disconnected");
        setAccount(accounts[0]);
        connect();
      }
    };
    const onChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [connect, disconnect]);

  const isCorrectNetwork = chainId && SUPPORTED_CHAINS.includes(chainId) && !!getContractAddress(chainId);

  const switchNetwork = async (targetChainId = NETWORK_CHAIN_ID) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (e) {
      if (e.code === 4902) {
        const net = NETWORKS[targetChainId] || { chainName: "Sepolia", rpcUrl: READ_RPC_URL, blockExplorer: BLOCK_EXPLORER_BASE_URL };
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: net.chainName,
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: [net.rpcUrl || READ_RPC_URL],
            blockExplorerUrls: net.blockExplorer ? [net.blockExplorer] : [],
          }],
        });
      }
    }
  };

  const isAdmin = account && platformAdmin && account.toLowerCase() === platformAdmin.toLowerCase();

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        contract,
        chainId,
        platformAdmin,
        isAdmin,
        isConnecting,
        error,
        isConnected: !!account,
        isCorrectNetwork,
        networkName: NETWORK_NAME,
        targetChainId: NETWORK_CHAIN_ID,
        connect,
        disconnect,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be inside Web3Provider");
  return ctx;
}
