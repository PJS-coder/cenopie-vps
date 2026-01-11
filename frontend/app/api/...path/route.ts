import { NextRequest } from 'next/server';

// This is a catch-all API route that proxies requests to the backend API
export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
  const path = request.nextUrl.pathname.replace('/api', '');
  const queryString = request.nextUrl.search;
  
  try {
    const response = await fetch(`${apiUrl}${path}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
  const path = request.nextUrl.pathname.replace('/api', '');
  
  try {
    const body = await request.json();
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  const path = request.nextUrl.pathname.replace('/api', '');
  
  try {
    const body = await request.json();
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
  const path = request.nextUrl.pathname.replace('/api', '');
  
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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