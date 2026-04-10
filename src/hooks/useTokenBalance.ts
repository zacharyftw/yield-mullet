"use client";

import { useBalance, useReadContract } from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import type { Address } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface UseTokenBalanceParams {
  address?: Address;
  tokenAddress?: string;
  chainId?: number;
  decimals?: number;
}

export function useTokenBalance({
  address,
  tokenAddress,
  chainId,
  decimals = 18,
}: UseTokenBalanceParams) {
  const isNative = !tokenAddress || tokenAddress === ZERO_ADDRESS;

  // Native balance
  const {
    data: nativeBalance,
    isLoading: isLoadingNative,
    refetch: refetchNative,
  } = useBalance({
    address,
    chainId,
    query: { enabled: !!address && isNative },
  });

  // ERC20 balance
  const {
    data: erc20Balance,
    isLoading: isLoadingErc20,
    refetch: refetchErc20,
  } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address && !isNative && !!tokenAddress },
  });

  const rawBalance = isNative
    ? nativeBalance?.value
    : (erc20Balance as bigint | undefined);

  const formatted = rawBalance
    ? formatUnits(rawBalance, isNative ? 18 : decimals)
    : "0";

  const display =
    parseFloat(formatted) > 0
      ? parseFloat(formatted).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })
      : "0";

  return {
    balance: rawBalance ?? BigInt(0),
    formatted,
    display,
    isLoading: isNative ? isLoadingNative : isLoadingErc20,
    refetch: isNative ? refetchNative : refetchErc20,
  };
}
