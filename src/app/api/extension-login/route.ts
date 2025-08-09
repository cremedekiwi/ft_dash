import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionCookie } = body;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Session cookie is required' },
        { status: 400 }
      );
    }

    // Test the session cookie by making a request to the 42 API
    const testResponse = await fetch('https://dashboard.42paris.fr/api/attendance', {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': `session=${sessionCookie}`,
        'priority': 'u=1, i',
        'referer': 'https://dashboard.42paris.fr/attendance',
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
      }
    });

    if (!testResponse.ok) {
      devLog.error('Invalid session cookie from extension:', testResponse.status);
      return NextResponse.json(
        { error: 'Invalid session cookie' },
        { status: 401 }
      );
    }

    // Session is valid, set it as a cookie and return success
    const response = NextResponse.json({ success: true });
    
    // Set the session cookie with proper options
    response.cookies.set('session', sessionCookie, {
      httpOnly: false, // Allow client-side access for compatibility
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    devLog.info('Extension login successful');
    return response;

  } catch (error) {
    devLog.error('Extension login error:', error);
    return NextResponse.json(
      { error: 'Failed to process login' },
      { status: 500 }
    );
  }
}