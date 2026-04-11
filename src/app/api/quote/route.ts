import { NextRequest, NextResponse } from 'next/server';
import { getComposerQuote } from '@/lib/lifi';
import { validateAddress, validateChainId, validateAmount, ValidationError } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const fromChain = validateChainId(searchParams.get('fromChain'), 'fromChain');
    const toChain = validateChainId(searchParams.get('toChain'), 'toChain');
    const fromToken = validateAddress(searchParams.get('fromToken'), 'fromToken');
    const toToken = validateAddress(searchParams.get('toToken'), 'toToken');
    const fromAddress = validateAddress(searchParams.get('fromAddress'), 'fromAddress');
    const toAddress = validateAddress(searchParams.get('toAddress'), 'toAddress');
    const fromAmount = validateAmount(searchParams.get('fromAmount'));
    const slippage = searchParams.get('slippage');

    const quote = await getComposerQuote({
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAddress,
      toAddress,
      fromAmount,
      slippage: slippage ? Number(slippage) : undefined,
    });

    return NextResponse.json(quote);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[api/quote]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
