import { NextRequest, NextResponse } from 'next/server';
import { fetchPortfolio } from '@/lib/lifi';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    const data = await fetchPortfolio(address);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('[api/portfolio]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
