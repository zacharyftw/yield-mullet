import { NextRequest, NextResponse } from 'next/server';
import { getComposerQuote } from '@/lib/lifi';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const fromChain = searchParams.get('fromChain');
    const toChain = searchParams.get('toChain');
    const fromToken = searchParams.get('fromToken');
    const toToken = searchParams.get('toToken');
    const fromAddress = searchParams.get('fromAddress');
    const toAddress = searchParams.get('toAddress');
    const fromAmount = searchParams.get('fromAmount');
    const slippage = searchParams.get('slippage');

    if (!fromChain || !toChain || !fromToken || !toToken || !fromAddress || !toAddress || !fromAmount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const quote = await getComposerQuote({
      fromChain: Number(fromChain),
      toChain: Number(toChain),
      fromToken,
      toToken, // This is the VAULT ADDRESS
      fromAddress,
      toAddress,
      fromAmount,
      slippage: slippage ? Number(slippage) : undefined,
    });

    return NextResponse.json(quote);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
