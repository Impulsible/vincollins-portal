// src/app/client-layout.tsx - CLIENT COMPONENT
'use client'

import { ProgressBar } from '@/components/ProgressBar';
import { GlobalLoadingWrapper } from '@/components/GlobalLoadingWrapper';
import { UserProvider } from '@/contexts/UserContext';
import { Providers } from '@/components/providers';
import { ConditionalHeader } from '@/components/layout/ConditionalHeader';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProgressBar />
      <UserProvider>
        <Providers>
          <ConditionalHeader />
          <GlobalLoadingWrapper>
            <div className="relative flex min-h-screen flex-col">
              {children}
            </div>
          </GlobalLoadingWrapper>
        </Providers>
      </UserProvider>
    </>
  );
}