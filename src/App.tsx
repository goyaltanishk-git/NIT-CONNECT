import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { Component } from "@/components/ui/hero-futuristic";
import * as Sentry from "@sentry/react";

const queryClient = new QueryClient();

const App = () => (
  <Sentry.ErrorBoundary
    fallback={
      <div className="h-dvh flex items-center justify-center bg-black text-white text-center p-8">
        <div>
          <p className="text-2xl font-bold text-pink-500 mb-2">Something went wrong</p>
          <p className="text-gray-400 mb-4">Our team has been notified. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-pink-600 rounded-full text-white font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>
    }
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
              <Route path='/temp' element={<Component />} />
            </Routes>
          </AuthGuard>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
