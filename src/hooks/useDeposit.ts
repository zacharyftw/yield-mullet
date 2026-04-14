"use client";

import { useState, useCallback } from "react";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { erc20Abi, maxUint256 } from "viem";
import type { ComposerQuote } from "@/types";
import type { Address } from "viem";
import { isValidLifiTarget, LIFI_DIAMOND } from "@/lib/lifi-contracts";

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

interface UseDepositParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string; // vault address
  fromAddress: string;
  fromAmount: string; // in smallest unit
}

export function useDeposit() {
  const [quote, setQuote] = useState<ComposerQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  const publicClient = usePublicClient();

  const {
    writeContractAsync,
  } = useWriteContract();

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: txError,
    reset: resetTx,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Check if the token needs approval and if so, whether allowance is sufficient
  const checkAllowance = useCallback(
    async (tokenAddress: string, owner: string, amount: string) => {
      if (tokenAddress.toLowerCase() === NATIVE_TOKEN) {
        setNeedsApproval(false);
        return false;
      }
      if (!publicClient) return false;

      const allowance = await publicClient.readContract({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner as Address, LIFI_DIAMOND as Address],
      });

      const needed = BigInt(amount);
      const approvalNeeded = allowance < needed;
      setNeedsApproval(approvalNeeded);
      return approvalNeeded;
    },
    [publicClient]
  );

  const getQuote = useCallback(
    async (params: UseDepositParams) => {
      setIsQuoting(true);
      setQuoteError(null);
      setQuote(null);

      try {
        const url = new URL("/api/quote", window.location.origin);
        url.searchParams.set("fromChain", String(params.fromChain));
        url.searchParams.set("toChain", String(params.toChain));
        url.searchParams.set("fromToken", params.fromToken);
        url.searchParams.set("toToken", params.toToken);
        url.searchParams.set("fromAddress", params.fromAddress);
        url.searchParams.set("toAddress", params.fromAddress);
        url.searchParams.set("fromAmount", params.fromAmount);

        const res = await fetch(url.toString());
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Quote failed: ${res.status}`);
        }

        const data: ComposerQuote = await res.json();
        setQuote(data);

        // Check allowance after getting quote
        await checkAllowance(
          params.fromToken,
          params.fromAddress,
          params.fromAmount
        );

        return data;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to get quote";
        setQuoteError(message);
        return null;
      } finally {
        setIsQuoting(false);
      }
    },
    [checkAllowance]
  );

  const approve = useCallback(
    async (tokenAddress: string, amount: string) => {
      setIsApproving(true);
      try {
        const hash = await writeContractAsync({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [LIFI_DIAMOND as Address, maxUint256],
        });

        // Wait for approval tx to confirm
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        setNeedsApproval(false);
        return true;
      } catch {
        setQuoteError("Token approval failed");
        return false;
      } finally {
        setIsApproving(false);
      }
    },
    [writeContractAsync, publicClient]
  );

  const sendTx = useCallback(() => {
    if (!quote?.transactionRequest) return;

    const { to, data, value, chainId } = quote.transactionRequest;

    if (!isValidLifiTarget(to)) {
      setQuoteError("Quote targets unknown contract — aborting for safety");
      return;
    }

    sendTransaction({
      to: to as Address,
      data: data as `0x${string}`,
      value: BigInt(value || "0"),
      chainId,
    });
  }, [quote, sendTransaction]);

  const reset = useCallback(() => {
    setQuote(null);
    setQuoteError(null);
    setNeedsApproval(false);
    resetTx();
  }, [resetTx]);

  return {
    quote,
    isQuoting,
    quoteError,
    getQuote,
    needsApproval,
    isApproving,
    approve,
    sendTx,
    isSending,
    isConfirming,
    isConfirmed,
    txHash,
    txError: txError ? txError.message : null,
    reset,
  };
}
