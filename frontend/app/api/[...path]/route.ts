import { NextRequest } from 'next/server';

// This is a catch-all API route that proxies requests to the backend API
export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
  const path = request.nextUrl.pathname.replace('/api', '/api');
  const queryString = request.nextUrl.search;
  
  // Forward authentication headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers['cookie'] = cookieHeader;
  }
  
  try {
    const response = await fetch(`${apiUrl}${path}${queryString}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request to backend API' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
  const path = request.nextUrl.pathname.replace('/api', '/api');
  
  // Forward authentication headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers['cookie'] = cookieHeader;
  }
  
  try {
    const body = await request.json();
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request to backend API' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
  const path = request.nextUrl.pathname.replace('/api', '/api');
  
  // Forward authentication headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers['cookie'] = cookieHeader;
  }
  
  try {
    const body = await request.json();
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request to backend API' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
  const path = request.nextUrl.pathname.replace('/api', '/api');
  
  // Forward authentication headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers['cookie'] = cookieHeader;
  }
  
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'DELETE',
      headers,
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request to backend API' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}