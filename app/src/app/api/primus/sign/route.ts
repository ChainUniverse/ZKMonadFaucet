import { NextRequest, NextResponse } from 'next/server';
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk';

export async function POST(request: NextRequest) {
  try {
    const { signParams } = await request.json();

    if (!signParams) {
      return NextResponse.json(
        { error: 'Missing signParams' },
        { status: 400 }
      );
    }

    const appId = process.env.PRIMUS_APP_ID;
    const appSecret = process.env.PRIMUS_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Missing Primus credentials' },
        { status: 500 }
      );
    }

    // Create PrimusZKTLS instance
    const primusZKTLS = new PrimusZKTLS();
    await primusZKTLS.init(appId, appSecret);

    // Sign the request
    const signResult = await primusZKTLS.sign(signParams);
    console.log('Sign result:', signResult);

    return NextResponse.json({ signResult });
  } catch (error) {
    console.error('Error signing request:', error);
    return NextResponse.json(
      { error: 'Failed to sign request' },
      { status: 500 }
    );
  }
}