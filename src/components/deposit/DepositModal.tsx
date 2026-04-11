"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Fuel,
  ArrowRight,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { Vault } from "@/types";
import { useDeposit } from "@/hooks/useDeposit";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { getTokensForChain, type TokenOption } from "@/lib/tokens";
import { CHAIN_NAMES, SUPPORTED_CHAIN_IDS } from "@/lib/chains";
import type { Address } from "viem";

interface DepositModalProps {
  vault: Vault;
  isOpen: boolean;
  onClose: () => void;
}

const protocolNames: Record<string, string> = {
  "morpho-v1": "Morpho", "morpho-v2": "Morpho", "aave-v3": "Aave V3",
  "yo-protocol": "YO Protocol", "pendle": "Pendle", "spark": "Spark",
  "fluid": "Fluid", "euler-v2": "Euler", "ethena": "Ethena",
  "etherfi": "Ether.fi", "maple": "Maple", "compound-v3": "Compound",
  "neverland": "Neverland", "concrete": "Concrete", "kelp": "Kelp",
  "kinetiq": "Kinetiq", "hyperlend": "HyperLend", "hypurrfi": "Hypurrfi",
  "tokemak": "Tokemak", "upshift": "Upshift", "usdai": "USDAi",
  "avon": "Avon", "felix-vanilla": "Felix",
};

function cleanProtocolName(slug: string): string {
  return protocolNames[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatTvl(tvlStr: string): string {
  const tvl = parseFloat(tvlStr);
  if (isNaN(tvl)) return "$0";
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(0)}K`;
  return `$${tvl.toFixed(0)}`;
}

export default function DepositModal({
  vault,
  isOpen,
  onClose,
}: DepositModalProps) {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  const [amount, setAmount] = useState("");
  const [fromChainId, setFromChainId] = useState<number>(connectedChainId);
  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);
  const [showChainSelect, setShowChainSelect] = useState(false);
  const [showTokenSelect, setShowTokenSelect] = useState(false);

  const {
    quote,
    isQuoting,
    quoteError,
    getQuote,
    sendTx,
    isSending,
    isConfirming,
    isConfirmed,
    txHash,
    txError,
    reset,
  } = useDeposit();

  // Available tokens for selected chain
  const availableTokens = useMemo(
    () => getTokensForChain(fromChainId),
    [fromChainId]
  );

  // Default token to USDC when chain changes
  useEffect(() => {
    const tokens = getTokensForChain(fromChainId);
    const usdc = tokens.find((t) => t.symbol === "USDC");
    setSelectedToken(usdc || tokens[0] || null);
  }, [fromChainId]);

  // Sync fromChain with connected chain
  useEffect(() => {
    if (connectedChainId && SUPPORTED_CHAIN_IDS.includes(connectedChainId as typeof SUPPORTED_CHAIN_IDS[number])) {
      setFromChainId(connectedChainId);
    }
  }, [connectedChainId]);

  // Token balance
  const { display: balanceDisplay, balance: rawBalance } = useTokenBalance({
    address: address as Address | undefined,
    tokenAddress: selectedToken?.address,
    chainId: fromChainId,
    decimals: selectedToken?.decimals,
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      reset();
    }
  }, [isOpen, reset]);

  // Compute amounts
  const parsedAmount = parseFloat(amount) || 0;
  const fromAmountSmallest = useMemo(() => {
    if (!selectedToken || parsedAmount <= 0) return "0";
    const factor = BigInt(10 ** selectedToken.decimals);
    // Use integer math to avoid floating point issues
    const wholePart = BigInt(Math.floor(parsedAmount));
    const fracStr = (parsedAmount % 1).toFixed(selectedToken.decimals).slice(2);
    const fracPart = BigInt(fracStr);
    return (wholePart * factor + fracPart).toString();
  }, [parsedAmount, selectedToken]);

  // Estimated yearly earnings
  const apy = vault.analytics.apy.total ?? 0;
  const yearlyEarnings = parsedAmount * (apy / 100);

  // Insufficient balance check
  const hasInsufficientBalance = useMemo(() => {
    if (!selectedToken || parsedAmount <= 0) return false;
    const factor = BigInt(10 ** selectedToken.decimals);
    const wholePart = BigInt(Math.floor(parsedAmount));
    const needed = wholePart * factor;
    return needed > rawBalance;
  }, [parsedAmount, rawBalance, selectedToken]);

  // Need chain switch?
  const needsChainSwitch = connectedChainId !== fromChainId;

  const handleGetQuote = async () => {
    if (!address || !selectedToken || parsedAmount <= 0) return;

    await getQuote({
      fromChain: fromChainId,
      toChain: vault.chainId,
      fromToken: selectedToken.address,
      toToken: vault.address,
      fromAddress: address,
      fromAmount: fromAmountSmallest,
    });
  };

  const handleDeposit = () => {
    if (needsChainSwitch) {
      switchChain({ chainId: fromChainId });
      return;
    }
    sendTx();
  };

  const handleSetMax = () => {
    if (!selectedToken) return;
    const factor = 10 ** selectedToken.decimals;
    const maxAmount = Number(rawBalance) / factor;
    setAmount(maxAmount.toString());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Deposit
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    via LI.FI Composer
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Vault Info */}
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {cleanProtocolName(vault.protocol.name)}
                    </p>
                    <p className="text-xs text-muted">{vault.network}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {apy.toFixed(1)}% APY
                    </p>
                    <p className="text-xs text-muted">
                      TVL {formatTvl(vault.analytics.tvl.usd)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 pb-5 space-y-4">
                {/* Success State */}
                {isConfirmed && txHash && (
                  <div className="flex flex-col items-center py-6 space-y-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <CheckCircle2 className="h-14 w-14 text-primary" />
                    </motion.div>
                    <p className="text-lg font-semibold text-foreground">
                      Deposit Successful!
                    </p>
                    <p className="text-sm text-muted text-center">
                      Your funds are being deposited into the vault.
                    </p>
                    <a
                      href={`https://explorer.li.fi/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      View Transaction
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={onClose}
                      className="mt-2 w-full py-3 rounded-xl bg-primary text-background font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* Error State */}
                {txError && !isConfirmed && (
                  <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-400">
                          Transaction Failed
                        </p>
                        <p className="text-xs text-red-400/70 mt-1 break-all">
                          {txError}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={reset}
                      className="mt-3 w-full py-2 rounded-lg border border-red-400/30 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Main Form (shown when not in success/error state) */}
                {!isConfirmed && !txError && (
                  <>
                    {/* Chain Selector */}
                    <div>
                      <label className="text-xs text-muted uppercase tracking-wider block mb-1.5">
                        From Chain
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setShowChainSelect(!showChainSelect)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:border-border-highlight/40 transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {CHAIN_NAMES[fromChainId] || `Chain ${fromChainId}`}
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted" />
                        </button>

                        <AnimatePresence>
                          {showChainSelect && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full mt-1 left-0 right-0 z-10 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                            >
                              {SUPPORTED_CHAIN_IDS.map((id) => (
                                <button
                                  key={id}
                                  onClick={() => {
                                    setFromChainId(id);
                                    setShowChainSelect(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-border/30 transition-colors ${
                                    id === fromChainId
                                      ? "text-primary font-medium bg-primary/5"
                                      : "text-foreground"
                                  }`}
                                >
                                  {CHAIN_NAMES[id]}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Token + Amount */}
                    <div>
                      <label className="text-xs text-muted uppercase tracking-wider block mb-1.5">
                        Amount
                      </label>
                      <div className="relative rounded-xl border border-border bg-background/50 focus-within:border-primary/50 transition-colors">
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="any"
                            className="flex-1 bg-transparent px-4 py-3 text-lg font-medium text-foreground placeholder:text-muted/50 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          {/* Token selector button */}
                          <div className="relative pr-3">
                            <button
                              onClick={() =>
                                setShowTokenSelect(!showTokenSelect)
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-border/50 hover:bg-border/80 transition-colors"
                            >
                              <span className="text-sm font-medium text-foreground">
                                {selectedToken?.symbol || "Select"}
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 text-muted" />
                            </button>

                            <AnimatePresence>
                              {showTokenSelect && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute top-full mt-1 right-0 z-10 rounded-xl border border-border bg-card shadow-lg overflow-hidden min-w-[120px]"
                                >
                                  {availableTokens.map((token) => (
                                    <button
                                      key={token.address}
                                      onClick={() => {
                                        setSelectedToken(token);
                                        setShowTokenSelect(false);
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-border/30 transition-colors ${
                                        token.address ===
                                        selectedToken?.address
                                          ? "text-primary font-medium bg-primary/5"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {token.symbol}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Balance row */}
                        {isConnected && (
                          <div className="flex items-center justify-between px-4 pb-2 pt-0">
                            <span className="text-xs text-muted">
                              Balance: {balanceDisplay}{" "}
                              {selectedToken?.symbol}
                            </span>
                            <button
                              onClick={handleSetMax}
                              className="text-xs text-primary font-medium hover:underline"
                            >
                              MAX
                            </button>
                          </div>
                        )}
                      </div>

                      {isConnected && hasInsufficientBalance && parsedAmount > 0 && (
                        <p className="text-xs text-red-400 mt-1.5">
                          Insufficient balance
                        </p>
                      )}
                    </div>

                    {/* Estimated Earnings */}
                    {parsedAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted">
                            Estimated APY
                          </span>
                          <span className="text-sm font-semibold text-primary">
                            {apy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted">
                            Yearly Earnings
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            ~$
                            {yearlyEarnings.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Quote Details */}
                    {quote && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-xl border border-border/50 bg-background/30 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted mb-2">
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span>Route Details</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted">
                            Estimated Output
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {(
                              Number(quote.estimate.toAmount) /
                              10 ** (selectedToken?.decimals || 18)
                            ).toFixed(4)}
                          </span>
                        </div>

                        {quote.estimate.gasCosts &&
                          quote.estimate.gasCosts.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted flex items-center gap-1">
                                <Fuel className="h-3 w-3" />
                                Gas Cost
                              </span>
                              <span className="text-xs text-muted">
                                {(
                                  Number(quote.estimate.gasCosts[0].amount) /
                                  1e18
                                ).toFixed(6)}{" "}
                                {quote.estimate.gasCosts[0].token.symbol}
                              </span>
                            </div>
                          )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted">
                            Destination
                          </span>
                          <span className="text-xs text-muted">
                            {vault.network}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Quote Error */}
                    {quoteError && (
                      <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-400">{quoteError}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-1">
                      {!isConnected ? (
                        <button
                          onClick={() => openConnectModal?.()}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
                        >
                          <Wallet className="h-4 w-4" />
                          Connect wallet to deposit
                        </button>
                      ) : !quote ? (
                        <button
                          onClick={handleGetQuote}
                          disabled={
                            isQuoting ||
                            parsedAmount <= 0 ||
                            hasInsufficientBalance
                          }
                          className="w-full py-3.5 rounded-xl bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isQuoting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Getting Quote...
                            </>
                          ) : (
                            "Get Quote"
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleDeposit}
                          disabled={isSending || isConfirming}
                          className="w-full py-3.5 rounded-xl bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSending || isConfirming ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {isConfirming
                                ? "Confirming..."
                                : needsChainSwitch
                                  ? "Switching Chain..."
                                  : "Sending..."}
                            </>
                          ) : needsChainSwitch ? (
                            `Switch to ${CHAIN_NAMES[fromChainId]}`
                          ) : (
                            "Deposit"
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
