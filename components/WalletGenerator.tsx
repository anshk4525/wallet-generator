"use client"
import {  useState } from "react";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { mnemonicToSeed } from "bip39";
import { Wallet, HDNodeWallet } from "ethers";
import { Clipboard, Eye, EyeOff, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ethers } from "ethers";
import { toast, useToast } from "@/hooks/use-toast";
import { ToastAction } from "./ui/toast";

// Type definitions for wallets
interface SolanaWallet {
  publicKey: string;
  privateKey: string;
  balance: number;
}

interface EthereumWallet {
  address: string;
  privateKey: string;
  balance: string;
}

// Type Guard to check if the wallet is a Solana wallet
function isSolanaWallet(wallet: SolanaWallet | EthereumWallet): wallet is SolanaWallet {
  return (wallet as SolanaWallet).publicKey !== undefined;
}

// Helper functions to fetch balances
const fetchSolanaBalance = async (publicKey: string) => {
  try {
    const connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/LcPm2SxEcIVUFeUoHPwIKBzIswjACDkN");
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error("Error fetching Solana balance:", error);
    return 0;
  }
};

const fetchEthereumBalance = async (address: string) => {
  try {
    const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/LcPm2SxEcIVUFeUoHPwIKBzIswjACDkN");
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance); // Convert Wei to Ether
  } catch (error) {
    console.error("Error fetching Ethereum balance:", error);
    return "0.000000"; // Default value if error occurs
  }
};

export default function WalletGenerator() {
  const [mnemonic, setMnemonic] = useState<string>("");
  const [solanaWallets, setSolanaWallets] = useState<SolanaWallet[]>([]);
  const [ethWallets, setEthWallets] = useState<EthereumWallet[]>([]);
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState<boolean[]>([]);
  const [activeTab, setActiveTab] = useState<"solana" | "ethereum">("solana");
  const [ethIndex, setEthIndex] = useState<number>(0);

  const generateMnemonicPhrase = () => {
    if (!mnemonic) {
      const newMnemonic = generateMnemonic();
      setMnemonic(newMnemonic);
      setSolanaWallets([]);
      setEthWallets([]);
      setShowMnemonic(false);
      setEthIndex(0);
    }
  };

  const generateWallet = async () => {
    if (!mnemonic) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    if (activeTab === "solana") {
      const seed = mnemonicToSeedSync(mnemonic);
      const indexSeed = Buffer.from(seed.slice(0, 32));
      indexSeed[31] += solanaWallets.length; // Increment seed for unique wallet derivation

      const keypair = Keypair.fromSeed(indexSeed);
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = Buffer.from(keypair.secretKey).toString("hex");

      const balance = await fetchSolanaBalance(publicKey); // Fetch Solana balance

      setSolanaWallets([...solanaWallets, { publicKey, privateKey, balance }]);
      setShowPrivateKeys([...showPrivateKeys, false]);
    } else {
      const seed = await mnemonicToSeed(mnemonic);
      const derivationPath = `m/44'/60'/${ethIndex}'/0'`;
      const hdNode = HDNodeWallet.fromSeed(seed);
      const child = hdNode.derivePath(derivationPath);
      const privateKey = child.privateKey;
      const wallet = new Wallet(privateKey);

      const balance = await fetchEthereumBalance(wallet.address); // Fetch Ethereum balance

      setEthWallets([...ethWallets, { address: wallet.address, privateKey, balance }]);
      setEthIndex(ethIndex + 1);
      setShowPrivateKeys([...showPrivateKeys, false]);
    }
  };

  const deleteWallet = (index: number) => {
    if (activeTab === "solana") {
      const updatedWallets = solanaWallets.filter((_, i) => i !== index);
      setSolanaWallets(updatedWallets);
    } else {
      const updatedWallets = ethWallets.filter((_, i) => i !== index);
      setEthWallets(updatedWallets);
    }
    const updatedVisibility = showPrivateKeys.filter((_, i) => i !== index);
    setShowPrivateKeys(updatedVisibility);

    toast({
      description: "Your Wallet has been Deleted.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copied to clipboard!",
    });
  };

  const toggleMnemonicVisibility = () => {
    setShowMnemonic(!showMnemonic);
  };

  const togglePrivateKeyVisibility = (index: number) => {
    const updatedVisibility = [...showPrivateKeys];
    updatedVisibility[index] = !updatedVisibility[index];
    setShowPrivateKeys(updatedVisibility);
  };

  return (
    <main className="flex flex-col items-center justify-center mt-20 w-full max-w-4xl">
      {!mnemonic && (
        <Button onClick={generateMnemonicPhrase} className="mb-8">
          Generate Secret Phrase
        </Button>
      )}

      {mnemonic && (
        <Card className="w-full mb-8">
          <CardHeader>
            <CardTitle>Your 12-Word Secret Phrase</CardTitle>
            <CardDescription>
              Write this down and keep it safe. It can be used to recover your wallets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {showMnemonic
                ? mnemonic.split(" ").map((word, index) => (
                    <div
                      key={index}
                      className="bg-muted px-4 py-3 rounded-lg text-center text-lg font-medium text-foreground"
                    >
                      {word}
                    </div>
                  ))
                : Array.from({ length: 12 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-muted px-4 py-3 rounded-lg text-center text-lg font-medium text-foreground"
                    >
                      ••••
                    </div>
                  ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={toggleMnemonicVisibility}>
              {showMnemonic ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(mnemonic)}>
              <Clipboard className="h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {mnemonic && (
        <div className="w-full mb-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="solana">Solana</TabsTrigger>
              <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <Button onClick={generateWallet}>
                Generate New {activeTab === "solana" ? "Solana" : "Ethereum"} Wallet
              </Button>
            </div>
          </Tabs>
        </div>
      )}

      {(solanaWallets.length > 0 || ethWallets.length > 0) && (
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Generated {activeTab === "solana" ? "Solana" : "Ethereum"} Wallets
          </h2>

          {(activeTab === "solana" ? solanaWallets : ethWallets).map((wallet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, transform: "translateY(30px)" }}
              animate={{ opacity: 1, transform: "translateY(0)" }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Wallet {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{activeTab === "solana" ? "Public Key" : "Address"}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={isSolanaWallet(wallet) ? wallet.publicKey : wallet.address}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(isSolanaWallet(wallet) ? wallet.publicKey : wallet.address)
                        }
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Private Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showPrivateKeys[index] ? "text" : "password"}
                        value={showPrivateKeys[index] ? wallet.privateKey : "••••••••••••••••••••••••"}
                        readOnly
                      />
                      <Button variant="outline" onClick={() => togglePrivateKeyVisibility(index)}>
                        {showPrivateKeys[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" onClick={() => copyToClipboard(wallet.privateKey)}>
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Balance</Label>
                    <div className="text-xl font-semibold">
                      {activeTab === "solana" ? wallet.balance + " SOL" : wallet.balance + " ETH"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="destructive" onClick={() => deleteWallet(index)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
