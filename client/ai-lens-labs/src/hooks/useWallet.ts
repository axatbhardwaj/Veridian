import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { useToast } from '@/hooks/use-toast';

interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: BrowserProvider | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    account: null,
    isConnected: false,
    isConnecting: false,
    provider: null,
  });
  const { toast } = useToast();

  const checkIfWalletIsConnected = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          setWallet({
            account: accounts[0].address,
            isConnected: true,
            isConnecting: false,
            provider,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWallet({
        account: address,
        isConnected: true,
        isConnecting: false,
        provider,
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWallet(prev => ({ ...prev, isConnecting: false }));
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    setWallet({
      account: null,
      isConnected: false,
      isConnecting: false,
      provider: null,
    });
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  useEffect(() => {
    checkIfWalletIsConnected();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        checkIfWalletIsConnected();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
  };
};