import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  console.log('🔍 Debug session API called');
  
  try {
    const session = await auth();
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      sessionFound: !!session,
      sessionData: session ? {
        hasUser: !!session.user,
        userId: session.user?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        fullSession: session
      } : null,
      headers: {
        userAgent: req.headers.get('user-agent'),
        cookie: req.headers.get('cookie'),
        authorization: req.headers.get('authorization')
      },
      url: req.url,
      method: req.method
    };
    
    console.log('🔍 Session debug info:', debugInfo);
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('❌ Session debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 