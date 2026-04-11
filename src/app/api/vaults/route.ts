import { NextRequest, NextResponse } from 'next/server';
import { fetchVaults } from '@/lib/lifi';
import { correctMorphoVaults } from '@/lib/morpho';
import { validateChainId, validateSortBy, ValidationError } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await fetchVaults({
      chainId: searchParams.get('chainId') ? validateChainId(searchParams.get('chainId'), 'chainId') : undefined,
      minTvl: searchParams.get('minTvl') ? Number(searchParams.get('minTvl')) : undefined,
      sortBy: validateSortBy(searchParams.get('sortBy')),
    });

    const corrected = await correctMorphoVaults(data.data);
    return NextResponse.json({ data: corrected, total: corrected.length });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[api/vaults]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
