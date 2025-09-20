import { NextResponse } from 'next/server';

export async function GET() {
  // Only show in development for security
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      GOOGLE_CLIENT_ID_EXISTS: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
    });
  }

  // In production, show basic info only
  return NextResponse.json({
    message: 'Environment debug endpoint',
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    variables_loaded: {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    }
  });
}