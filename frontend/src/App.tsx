// app.tsx
import * as React from "react";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import WelcomeScreen from "./components/WelcomeScreen";
import ProfileSetup from "./components/ProfileSetup";
import axios from "axios";

type Page = 'landing' | 'login' | 'signup' | 'welcome' | 'profile-setup' | 'dashboard';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<Page>('landing');
  const [jwt, setJwt] = React.useState<string | null>(localStorage.getItem('jwt'));
  const [userName, setUserName] = React.useState<string>('User');
  const [userEmail, setUserEmail] = React.useState<string>('');
  const [isProfileComplete, setIsProfileComplete] = React.useState(false);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [openDashboardModal, setOpenDashboardModal] = React.useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = React.useState<number>(2200);
  const [lastSyncTimeDisplay, setLastSyncTimeDisplay] = React.useState<string>('just now');

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarNavigate = React.useCallback((page: string) => {
    setSidebarOpen(false); // Close sidebar after navigation
    setOpenDashboardModal(page); // Tell dashboard to open modal
  }, []);

  // Decode JWT to extract user info
  React.useEffect(() => {
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        setUserName(payload.name || payload.email?.split('@')[0] || 'User');
        setUserEmail(payload.email || '');
      } catch (err) {
        console.error('Failed to decode JWT:', err);
      }
    }
  }, [jwt]);

  // Check if user profile is complete
  React.useEffect(() => {
    const checkProfile = async () => {
      if (!jwt) {
        setProfileLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        
        const profileComplete = response.data.profile?.isProfileComplete || false;
        setIsProfileComplete(profileComplete);
        
        // Update daily goal from profile
        if (response.data.profile?.dailyCalorieGoal) {
          setDailyGoal(response.data.profile.dailyCalorieGoal);
        }
        
        // If logged in but profile not complete AND on dashboard, redirect to onboarding
        if (currentPage === 'dashboard' && !profileComplete) {
          setCurrentPage('welcome');
        }
      } catch (err) {
        console.error("Failed to check profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    checkProfile();
  }, [jwt]);

  // Check for JWT on mount and redirect accordingly
  React.useEffect(() => {
    // Check if there's a token in the URL hash (from Google OAuth callback)
    const hash = window.location.hash;
    if (hash.includes('token=')) {
      const urlToken = hash.split('token=')[1].split('&')[0];
      console.log('✅ Token received from OAuth callback');
      setJwt(urlToken);
      localStorage.setItem('jwt', urlToken);
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      setCurrentPage('dashboard');
      return;
    }

    // Otherwise check localStorage
    const token = localStorage.getItem('jwt');
    if (token) {
      setJwt(token);
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('landing');
    }
  }, []);

  // ESC closes sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleLoginSuccess = (token: string, isNewSignup: boolean = false) => {
    console.log('✅ handleLoginSuccess called with token');
    setJwt(token);
    localStorage.setItem('jwt', token);
    console.log('📍 Checking profile status...');
    // If new signup, go to profile setup; otherwise go to welcome
    setCurrentPage(isNewSignup ? 'profile-setup' : 'welcome');
  };

  const handleLogout = () => {
    setJwt(null);
    localStorage.removeItem('jwt');
    setCurrentPage('landing');
  };

  // Render based on current page
  if (currentPage === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'login') {
    return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'signup') {
    return <Signup onNavigate={handleNavigate} onSignupSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'welcome') {
    return <WelcomeScreen onContinue={() => setCurrentPage('profile-setup')} />;
  }

  if (currentPage === 'profile-setup') {
    return <ProfileSetup onComplete={() => {
      setIsProfileComplete(true);
      setCurrentPage('dashboard');
    }} />;
  }

  // Show loading while checking profile
  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Dashboard (protected)
  return (
    <div className="app-shell">
      {/* Sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onLogout={handleLogout}
        onNavigate={handleSidebarNavigate}
        dailyGoal={dailyGoal}
        userName={userName}
      />

      {/* Main region */}
      <div className="main-region">
        <TopNav 
          onToggleSidebar={toggleSidebar} 
          onLogout={handleLogout}
          userName={userName}
          userEmail={userEmail}
          lastSyncTime={lastSyncTimeDisplay}
        />

        <main>
          <Dashboard 
            openModal={openDashboardModal}
            onModalClose={() => setOpenDashboardModal(null)}
            onSyncTimeUpdate={setLastSyncTimeDisplay}
          />
        </main>
      </div>
    </div>
  );
}