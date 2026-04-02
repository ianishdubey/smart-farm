import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FarmSetup from './pages/FarmSetup';
import Dashboard from './pages/Dashboard';
import ChatBot from './components/ChatBot';

type AppRoute = 'landing' | 'auth' | 'setup' | 'dashboard';

function routeFromPath(pathname: string): AppRoute {
  if (pathname === '/auth') return 'auth';
  if (pathname === '/setup') return 'setup';
  if (pathname === '/dashboard') return 'dashboard';
  return 'landing';
}

function pathFromRoute(route: AppRoute): string {
  if (route === 'auth') return '/auth';
  if (route === 'setup') return '/setup';
  if (route === 'dashboard') return '/dashboard';
  return '/';
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [hasFarm, setHasFarm] = useState<boolean | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => routeFromPath(window.location.pathname));
  const [showLandingChat, setShowLandingChat] = useState(false);

  useEffect(() => {
    const knownPaths = new Set(['/', '/auth', '/setup', '/dashboard']);
    if (!knownPaths.has(window.location.pathname)) {
      window.history.replaceState({}, '', '/');
      setCurrentRoute('landing');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(routeFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentRoute !== 'landing') {
      setShowLandingChat(false);
    }
  }, [currentRoute]);

  useEffect(() => {
    if (user) {
      checkFarmProfile();
    } else {
      setHasFarm(null);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || (user && hasFarm === null)) {
      return;
    }

    if (!user) {
      if (currentRoute === 'dashboard' || currentRoute === 'setup') {
        navigateToRoute('auth', { replace: true });
      }
      return;
    }

    if (!hasFarm) {
      if (currentRoute === 'auth' || currentRoute === 'dashboard') {
        navigateToRoute('setup', { replace: true });
      }
      return;
    }

    if (currentRoute === 'auth' || currentRoute === 'setup') {
      navigateToRoute('dashboard', {
        replace: true,
        search: window.location.pathname === '/dashboard' && window.location.search
          ? window.location.search
          : '?tab=overview',
      });
    }
  }, [authLoading, user, hasFarm, currentRoute]);

  function navigateToRoute(route: AppRoute, options?: { replace?: boolean; search?: string }) {
    const nextPath = pathFromRoute(route);
    const nextSearch = options?.search || '';
    const nextUrl = `${nextPath}${nextSearch}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      if (options?.replace) {
        window.history.replaceState({}, '', nextUrl);
      } else {
        window.history.pushState({}, '', nextUrl);
      }
    }

    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToPrimaryFlow() {
    if (!user) {
      navigateToRoute('auth');
      return;
    }

    if (hasFarm) {
      navigateToRoute('dashboard', { search: '?tab=overview' });
      return;
    }

    navigateToRoute('setup');
  }

  async function checkFarmProfile() {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setHasFarm(false);
        return;
      }

      const response = await fetch(`${apiUrl}/farms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const farm = await response.json();
        setHasFarm(!!farm);
      } else {
        setHasFarm(false);
      }
    } catch (error) {
      console.error('Error checking farm profile:', error);
      setHasFarm(false);
    }
  }

  if (authLoading || (user && hasFarm === null)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentRoute === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={goToPrimaryFlow}
          onChatWithAI={() => setShowLandingChat(true)}
          onBrandClick={() => navigateToRoute('landing')}
          isChatOpen={showLandingChat}
        />
        {showLandingChat && (
          <ChatBot onClose={() => setShowLandingChat(false)} />
        )}
      </>
    );
  }

  if (currentRoute === 'auth') {
    if (user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
          Redirecting to your farm workspace...
        </div>
      );
    }
    return <AuthPage onBrandClick={() => navigateToRoute('landing')} />;
  }

  if (currentRoute === 'setup') {
    if (!user) {
      return <AuthPage onBrandClick={() => navigateToRoute('landing')} />;
    }

    if (hasFarm) {
      return <Dashboard onBrandClick={() => navigateToRoute('landing')} />;
    }

    return (
      <FarmSetup
        onComplete={() => {
          setHasFarm(true);
          navigateToRoute('dashboard', { replace: true, search: '?tab=overview' });
        }}
        onBrandClick={() => navigateToRoute('landing')}
      />
    );
  }

  if (!user) {
    return <AuthPage onBrandClick={() => navigateToRoute('landing')} />;
  }

  if (!hasFarm) {
    return (
      <FarmSetup
        onComplete={() => {
          setHasFarm(true);
          navigateToRoute('dashboard', { replace: true, search: '?tab=overview' });
        }}
        onBrandClick={() => navigateToRoute('landing')}
      />
    );
  }

  return <Dashboard onBrandClick={() => navigateToRoute('landing')} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
