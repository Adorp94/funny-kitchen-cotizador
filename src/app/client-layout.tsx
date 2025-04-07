"use client";

import { Auth0Provider } from '@auth0/auth0-react';
import Footer from '@/components/footer';
import Header from '@/components/header';
import { usePathname } from 'next/navigation';

// Remove AuthGuard import since we're using middleware
// import AuthGuard from "./auth-guard";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSignInPage = pathname === '/';
  
  // Get Auth0 configuration from environment variables or hard-code for development
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-av1unzc74ll0psau.us.auth0.com';
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'y3zkQqmOiFGAV3OzU4bF5LIl631V6Jxb';
  
  // Use window.location.origin for redirectUri in client components to avoid SSR issues
  const redirectUri = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback';

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        scope: 'openid profile email'
      }}
      cacheLocation="localstorage"
    >
      <div className="flex flex-col min-h-screen bg-gray-50">
        {!isSignInPage && <Header />}
        <main className={`flex-1 ${!isSignInPage ? 'pt-6 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto w-full' : ''}`}>
          {children}
        </main>
        {!isSignInPage && <Footer />}
      </div>
    </Auth0Provider>
  );
} 