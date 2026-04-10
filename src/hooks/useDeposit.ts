"use client";

import { useState, useCallback } from "react";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import type { ComposerQuote } from "@/types";
import type { Address } from "viem";

interface UseDepositParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string; // vault address
  fromAddress?: string;
  fromAmount: string; // in smallest unit
}

export function useDeposit() {
  const [quote, setQuote] = useState<ComposerQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

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

  const getQuote = useCallback(async (params: UseDepositParams) => {
    setIsQuoting(true);
    setQuoteError(null);
    setQuote(null);

    try {
      const url = new URL("/api/quote", window.location.origin);
      url.searchParams.set("fromChain", String(params.fromChain));
      url.searchParams.set("toChain", String(params.toChain));
      url.searchParams.set("fromToken", params.fromToken);
      url.searchParams.set("toToken", params.toToken);
      url.searchParams.set("fromAddress", params.fromAddress || "");
      url.searchParams.set("toAddress", params.fromAddress || "");
      url.searchParams.set("fromAmount", params.fromAmount);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Quote failed: ${res.status}`);
      }

      const data: ComposerQuote = await res.json();
      setQuote(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to get quote";
      setQuoteError(message);
      return null;
    } finally {
      setIsQuoting(false);
    }
  }, []);

  const sendTx = useCallback(() => {
    if (!quote?.transactionRequest) return;

    const { to, data, value, chainId } = quote.transactionRequest;

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
    resetTx();
  }, [resetTx]);

  return {
    quote,
    isQuoting,
    quoteError,
    getQuote,
    sendTx,
    isSending,
    isConfirming,
    isConfirmed,
    txHash,
    txError: txError ? txError.message : null,
    reset,
  };
}
