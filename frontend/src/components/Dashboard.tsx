import { useEffect, useMemo, useState } from "react";
import Charts from "./Charts";
import NutritionLog from "./NutritionLog";
import FitnessLog from "./FitnessLog";
import Settings from "./Settings";
import ExerciseModal from "./ExerciseModal";
import { API_BASE } from "../apiBase";

const DAILY_GOAL_DEFAULT = 2200;

// Helpers to read/store JWT from URL fragment and localStorage
function extractTokenFromHash(): string | null {
  // Example: #connected=googlefit&token=JWT
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  const token = params.get("token");
  // Clean hash once read
  if (token) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return token;
}

function getJwt(): string | null {
  return localStorage.getItem("jwt");
}

function setJwt(token: string) {
  localStorage.setItem("jwt", token);
}

// Types
type UserInfo = {
  name: string;
  email: string;
};

type FitnessToday = {
  parsed: {
    steps: number;
    calories: number;
    heartPoints: number;
    distance: string;
    weight: number | null;
    height: number | null;
    bodyFat: number | null;
    heartRate: { value: number; time: string }[];
    activities: any[];
  };
  raw: any;
};

interface DashboardProps {
  openModal?: string | null;
  onModalClose?: () => void;
  onSyncTimeUpdate?: (time: string) => void;
}

export default function Dashboard({ openModal, onModalClose, onSyncTimeUpdate }: DashboardProps = {}) {
  // UI state
  const [jwt, setJwtState] = useState<string | null>(getJwt());
  const [dailyGoal, setDailyGoal] = useState<number>(DAILY_GOAL_DEFAULT);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Backend data
  const [fitness, setFitness] = useState<FitnessToday | null>(null);
  const [loadingFitness, setLoadingFitness] = useState(false);
  const [fitnessError, setFitnessError] = useState<string | null>(null);

  // Nutrition state
  const [caloriesConsumed, setCaloriesConsumed] = useState<number>(0);
  const [proteinConsumed, setProteinConsumed] = useState<number>(0);
  const [carbsConsumed, setCarbsConsumed] = useState<number>(0);
  const [fatConsumed, setFatConsumed] = useState<number>(0);
  const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
  const [showNutritionLog, setShowNutritionLog] = useState(false);
  const [showFitnessLog, setShowFitnessLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Streak state
  const [loginStreak, setLoginStreak] = useState<number>(0);
  const [goalStreak, setGoalStreak] = useState<number>(0);
  const [longestLoginStreak, setLongestLoginStreak] = useState<number>(0);

  // Last sync time
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncTimeDisplay, setSyncTimeDisplay] = useState<string>('just now');

  // Manual workout calories
  const [manualWorkoutCalories, setManualWorkoutCalories] = useState<number>(0);

  // Exercise recommendations
  const [exerciseRecs, setExerciseRecs] = useState<any>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Helper function to calculate relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  // Update sync time display every minute
  useEffect(() => {
    if (!lastSyncTime) return;

    const updateDisplay = () => {
      const timeStr = getRelativeTime(lastSyncTime);
      setSyncTimeDisplay(timeStr);
      onSyncTimeUpdate?.(timeStr); // Pass to parent
    };

    updateDisplay(); // Update immediately
    const interval = setInterval(updateDisplay, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastSyncTime, onSyncTimeUpdate]);

  // Decode JWT to get user info
  useEffect(() => {
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        setUserInfo({
          name: payload.name || payload.email?.split('@')[0] || 'User',
          email: payload.email || ''
        });
        console.log('👤 User info loaded:', payload.email);
      } catch (err) {
        console.error('Failed to decode JWT:', err);
      }
    }
  }, [jwt]);

  // On mount: capture JWT from OAuth redirect and store
  useEffect(() => {
    const tokenFromHash = extractTokenFromHash();
    if (tokenFromHash) {
      console.log('✅ OAuth completed! Token received:', tokenFromHash.substring(0, 20) + '...');
      setJwt(tokenFromHash);
      setJwtState(tokenFromHash);
      // Show success message
      alert('🎉 Google Fit connected successfully! Your data will load now.');
    }
  }, []);

  // Handle external modal opening (from Sidebar)
  useEffect(() => {
    if (openModal === 'settings') {
      setShowSettings(true);
      onModalClose?.(); // Clear the request
    } else if (openModal === 'nutrition') {
      setShowNutritionLog(true);
      onModalClose?.();
    } else if (openModal === 'fitness') {
      setShowFitnessLog(true);
      onModalClose?.();
    } else if (openModal === 'ai-insights') {
      alert('🤖 AI Insights - Coming Soon!\n\nThis feature will provide personalized recommendations based on your nutrition and fitness trends. Stay tuned!');
      onModalClose?.();
    }
  }, [openModal, onModalClose]);

  // Fetch fitness “today” once we have JWT
  async function fetchFitnessToday() {
    try {
      if (!jwt) {
        setFitnessError("Not connected to Google Fit yet.");
        console.log('❌ No JWT token. Click "Connect Google Fit" to authenticate.');
        return;
      }
      setLoadingFitness(true);
      setFitnessError(null);
      console.log('🔄 Fetching fitness data...', { jwt: jwt.substring(0, 20) + '...' });
      
      // Get user's timezone offset (in minutes)
      const tzOffset = new Date().getTimezoneOffset();
      console.log(`🌍 Sending timezone offset: ${tzOffset} minutes`);
      
      const resp = await fetch(`${API_BASE}/api/fitness/today?tz=${tzOffset}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (!resp.ok) {
        let errorMsg = `API error: ${resp.status}`;
        try {
          const errorBody = await resp.json();
          if (errorBody.message) {
            errorMsg = errorBody.message;
          }
        } catch {
          // If response is not JSON, fall back to text
          const t = await resp.text();
          errorMsg = t || errorMsg;
        }
        console.error('❌ API Error:', resp.status, errorMsg);
        throw new Error(errorMsg);
      }
      const data: FitnessToday = await resp.json();
      console.log('✅ Fitness data loaded:', data);
      console.log('📊 Parsed data:', {
        steps: data.parsed?.steps,
        calories: data.parsed?.calories,
        distance: data.parsed?.distance,
        heartPoints: data.parsed?.heartPoints
      });
      setFitness(data);
      setLastSyncTime(new Date()); // Update sync time on successful fetch
    } catch (e: any) {
      console.error('❌ Error:', e);
      setFitnessError(e?.message || "Failed to load fitness data");
    } finally {
      setLoadingFitness(false);
    }
  }

  // Fetch user profile to get calorie goal
  async function fetchUserProfile() {
    try {
      if (!jwt) return;
      
      console.log('👤 Fetching user profile...');
      const resp = await fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Profile loaded:', data);
        
        if (data.profile?.dailyCalorieGoal) {
          setDailyGoal(data.profile.dailyCalorieGoal);
        }
        
        // Check if user has any nutrition entries (first-time user)
        if (caloriesConsumed === 0 && nutritionHistory.length === 0) {
          setIsFirstTime(true);
        }
      }
    } catch (e) {
      console.error('❌ Failed to load profile:', e);
    }
  }

  // Fetch manual workout calories for today
  async function fetchManualWorkoutCalories() {
    try {
      if (!jwt) return;
      
      console.log('🏋️ Fetching manual workout calories...');
      const resp = await fetch(`${API_BASE}/api/workout/history?days=1`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Manual workouts loaded:', data);
        
        // Filter to today only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayWorkouts = data.workouts?.filter((w: any) => {
          const workoutDate = new Date(w.timestamp);
          workoutDate.setHours(0, 0, 0, 0);
          return workoutDate.getTime() === today.getTime();
        }) || [];
        
        const totalCalories = todayWorkouts.reduce((sum: number, w: any) => sum + (w.caloriesBurned || 0), 0);
        setManualWorkoutCalories(totalCalories);
        console.log(`🔥 Manual workout calories today: ${totalCalories}`);
      }
    } catch (e) {
      console.error('❌ Error fetching manual workouts:', e);
    }
  }

  // Fetch exercise recommendations
  async function fetchExerciseRecommendations() {
    try {
      if (!jwt) {
        console.log('❌ No JWT token found');
        return;
      }
      
      setLoadingRecs(true);
      console.log('🎯 Fetching exercise recommendations...');
      
      const resp = await fetch(`${API_BASE}/api/exercise-recommendations/today`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      console.log('📡 Response status:', resp.status);
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Exercise recommendations loaded:', data);
        setExerciseRecs(data.data);
      } else {
        const errorText = await resp.text();
        console.error('❌ Error response:', resp.status, errorText);
      }
    } catch (e) {
      console.error('❌ Error fetching exercise recommendations:', e);
    } finally {
      setLoadingRecs(false);
    }
  }

  // Fetch streaks
  async function fetchStreaks() {
    try {
      if (!jwt) return;
      
      console.log('🔥 Fetching streaks...');
      const resp = await fetch(`${API_BASE}/api/streaks`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Streaks loaded:', data);
        
        setLoginStreak(data.streaks.login.current);
        setLongestLoginStreak(data.streaks.login.longest);
        setGoalStreak(data.streaks.goalCompletion.current);
      }
    } catch (e) {
      console.error('❌ Failed to load streaks:', e);
    }
  }

  // Trigger initial fetch once JWT is present
  useEffect(() => {
    if (jwt) {
      fetchUserProfile();
      fetchFitnessToday();
      fetchNutritionToday();
      fetchNutritionHistory();
      fetchManualWorkoutCalories();
      fetchExerciseRecommendations();
      fetchStreaks();
    }
  }, [jwt]);

  // Fetch nutrition history (last 7 days)
  async function fetchNutritionHistory() {
    try {
      if (!jwt) return;
      
      console.log('📅 Fetching nutrition history...');
      const resp = await fetch(`${API_BASE}/api/nutrition/history`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Nutrition history loaded:', data.history);
        setNutritionHistory(data.history || []);
      }
    } catch (e) {
      console.error('❌ Error fetching nutrition history:', e);
    }
  }

  // Fetch nutrition data for today
  async function fetchNutritionToday() {
    try {
      if (!jwt) return;
      
      console.log('🍽️ Fetching nutrition data...');
      const resp = await fetch(`${API_BASE}/api/nutrition/today`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Nutrition data loaded:', data);
        
        // Calculate totals from entries
        const entries = data.entries || [];
        const totalCalories = entries.reduce((sum: number, e: any) => sum + (e.calories || 0), 0);
        const totalProtein = entries.reduce((sum: number, e: any) => sum + (e.protein || 0), 0);
        const totalCarbs = entries.reduce((sum: number, e: any) => sum + (e.carbs || 0), 0);
        const totalFat = entries.reduce((sum: number, e: any) => sum + (e.fat || 0), 0);
        
        setCaloriesConsumed(totalCalories);
        setProteinConsumed(totalProtein);
        setCarbsConsumed(totalCarbs);
        setFatConsumed(totalFat);
        
        console.log('📊 Nutrition totals:', { totalCalories, totalProtein, totalCarbs, totalFat });
      }
    } catch (e) {
      console.error('❌ Error fetching nutrition:', e);
    }
  }

  // Derived metrics
  const googleFitCalories = fitness?.parsed?.calories ? Math.round(fitness.parsed.calories) : 0;
  const caloriesBurned = googleFitCalories + manualWorkoutCalories;
  const steps = fitness?.parsed?.steps ?? 0;
  const distance = fitness?.parsed?.distance ?? '0';
  const heartPoints = fitness?.parsed?.heartPoints ?? 0;
  
  // Debug log
  useEffect(() => {
    if (fitness || manualWorkoutCalories > 0) {
      console.log('🎯 Current fitness state:', {
        steps,
        googleFitCalories,
        manualWorkoutCalories,
        totalCaloriesBurned: caloriesBurned,
        distance,
        heartPoints,
        rawFitness: fitness
      });
    }
  }, [fitness, steps, googleFitCalories, manualWorkoutCalories, caloriesBurned, distance, heartPoints]);
  
  const caloriesNet = useMemo(
    () => Math.max(caloriesConsumed - caloriesBurned, 0),
    [caloriesConsumed, caloriesBurned]
  );
  const caloriesRemaining = useMemo(
    () => Math.max(dailyGoal - caloriesNet, 0),
    [dailyGoal, caloriesNet]
  );
  const completionPercent = useMemo(
    () => Math.min(Math.round((caloriesNet / dailyGoal) * 100), 150),
    [caloriesNet, dailyGoal]
  );
  const gaugeProgress = Math.min(completionPercent, 100);

  // Tips
  const [tipMain, tipSub] = (() => {
    if (completionPercent < 50) {
      return [
        "You’re easing into the day — keep that pace.",
        "A balanced meal and a short walk will keep you perfectly aligned with your goal.",
      ];
    }
    if (completionPercent > 100) {
      return [
        "You’ve gone over your calorie target today.",
        "No panic. Focus on a lighter next meal, more water, and a quick activity burst. Progress is about the long run.",
      ];
    }
    return [
      "Keep going — your consistency is paying off.",
      "A quick stretch, a glass of water, and logging your next meal will keep your streak alive.",
    ];
  })();

  type QuickNavItem = {
    icon: string;
    label: string;
    sub: string;
    action: string;
    footer: string;
  };

  const quickNavItems: QuickNavItem[] = [
    {
      icon: "🥦",
      label: "Nutrition Log",
      sub: "Add meals, snacks, and drinks in seconds.",
      action: "nutrition",
      footer: "View today’s entries",
    },
    {
      icon: "🏃",
      label: "Fitness Log",
      sub: "Track workouts, steps, and active minutes.",
      action: "fitness",
      footer: "Refresh from Google Fit",
    },
    {
      icon: "🤖",
      label: "AI Insights",
      sub: "Personalized guidance based on your trends.",
      action: "ai-insights",
      footer: "View recommendations",
    },
    {
      icon: "⚙️",
      label: "Profile & Settings",
      sub: "Manage goals, preferences, and privacy.",
      action: "settings",
      footer: "Adjust your goals",
    },
  ];

  async function handleQuickNavClick(target: string) {
    if (target === "fitness") {
      // Open fitness log modal
      setShowFitnessLog(true);
      return;
    }
    if (target === "nutrition") {
      setShowNutritionLog(true);
      return;
    }
    if (target === "settings") {
      setShowSettings(true);
      return;
    }
    if (target === "ai-insights") {
      alert('🤖 AI Insights - Coming Soon!\n\nThis feature will provide personalized recommendations based on your nutrition and fitness trends. Stay tuned!');
      return;
    }
    console.log("Quick nav clicked:", target);
  }

  // Refresh nutrition data when modal closes
  function handleNutritionLogClose() {
    setShowNutritionLog(false);
    if (jwt) {
      fetchNutritionToday();
      fetchManualWorkoutCalories();
    }
  }

  function handleFitnessLogClose() {
    setShowFitnessLog(false);
    if (jwt) {
      fetchFitnessToday();
      fetchManualWorkoutCalories();
    }
  }

  return (
    <>
      {/* Action Buttons Section - Card Style */}
      <section className="page-row">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div
            onClick={() => setShowNutritionLog(true)}
            style={{ 
              padding: '24px',
              background: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍽️</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Log Nutrition</div>
            <div style={{ fontSize: '14px', opacity: 0.95 }}>Track your meals, snacks and macros for today</div>
          </div>
          <div
            onClick={() => setShowFitnessLog(true)}
            style={{ 
              padding: '24px',
              background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💪</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Log Fitness</div>
            <div style={{ fontSize: '14px', opacity: 0.95 }}>Record your workouts and active minutes</div>
          </div>
        </div>
      </section>

      {/* Welcome Message - Full Width Card */}
      {userInfo && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)', 
          borderRadius: '8px', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>
              Welcome back, {userInfo.name}! 
            </h2>
            <p style={{ margin: 0, opacity: 0.95, fontSize: '14px' }}>
              You're on a {loginStreak}-day streak. Today's goal is to maintain your net calorie balance while focusing on heart health.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-end' }}>
          </div>
        </div>
      )}
      
      {/* Your Daily Balance Card */}
      <section className="page-row">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Your Daily Balance</div>
              <div className="card-subtitle">Consumed vs burned calories</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '40px', padding: '20px 0', alignItems: 'start' }}>
            {/* Left: Circular Gauge - Calories Left */}
            <div
              className="gauge-wrapper"
              style={{ 
                ["--progress" as string]: Math.min((caloriesConsumed / dailyGoal) * 100, 100),
                width: '200px',
                height: '200px',
                margin: '0 auto'
              }}
            >
              <div className="gauge-inner" style={{ width: '154px', height: '154px' }}>
                <div className="gauge-label">KCAL LEFT</div>
                <div className="gauge-value" style={{ color: '#667eea' }}>
                  {caloriesRemaining}
                </div>
              </div>
              <div className="gauge-dot" />
            </div>

            {/* Right: Stats + Progress Bars */}
            <div>
              {/* Three Stat Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ 
                  background: '#f3f4f6', 
                  padding: '16px', 
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', marginBottom: '6px', textTransform: 'uppercase' }}>CONSUMED</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>{caloriesConsumed}</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>kcal</div>
                </div>

                <div style={{ 
                  background: '#f3f4f6', 
                  padding: '16px', 
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', marginBottom: '6px', textTransform: 'uppercase' }}>NET<br/>CALORIES</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{caloriesNet}</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>kcal</div>
                </div>

                <div style={{ 
                  background: '#f3f4f6', 
                  padding: '16px', 
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', marginBottom: '6px', textTransform: 'uppercase' }}>GOAL</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>{dailyGoal.toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>kcal</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div>
                {/* Protein */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Protein</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}>{proteinConsumed}G / 120G</div>
                  </div>
                  <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: '#667eea',
                        width: `${Math.min((proteinConsumed / 120) * 100, 100)}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Carbs</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}>{carbsConsumed}G / 250G</div>
                  </div>
                  <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: '#ff9800',
                        width: `${Math.min((carbsConsumed / 250) * 100, 100)}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Grid - 4 Column */}
      <section className="page-row">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Today's Activity</div>
            </div>
            <button
              className="btn-refresh"
              disabled={loadingFitness}
              onClick={fetchFitnessToday}
              title="Refresh from Google Fit"
            >
              {loadingFitness ? (
                <>
                  <span className="refresh-spinner">🔄</span> Refreshing...
                </>
              ) : (
                <>
                  🔄 Refresh Data
                </>
              )}
            </button>
          </div>
          
          <div className="grid-4">
            <div className="fitness-metric-card">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                marginBottom: '10px'
              }}>
                ⬆️
              </div>
              <div className="metric-content">
                <div className="metric-label">Steps</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{steps.toLocaleString()}</div>
              </div>
            </div>

            <div className="fitness-metric-card">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#ff9800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                marginBottom: '10px'
              }}>
                🔥
              </div>
              <div className="metric-content">
                <div className="metric-label">Burned</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{caloriesBurned.toLocaleString()} <span style={{ fontSize: '12px', color: '#666' }}>kcal</span></div>
              </div>
            </div>

            <div className="fitness-metric-card">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#2196F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                marginBottom: '10px'
              }}>
                📍
              </div>
              <div className="metric-content">
                <div className="metric-label">Distance</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{distance} <span style={{ fontSize: '12px', color: '#666' }}>km</span></div>
              </div>
            </div>

            <div className="fitness-metric-card">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#ff6b9d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                marginBottom: '10px'
              }}>
                ❤️
              </div>
              <div className="metric-content">
                <div className="metric-label">Heart Points</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{heartPoints.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}

      {/* Exercise Suggestions Card */}
      <section className="page-row">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🎯 Today's Exercise Suggestion</div>
            </div>
          </div>

          {loadingRecs ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>⏳ Analyzing your data...</p>
            </div>
          ) : !exerciseRecs ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Complete your profile and log meals to get recommendations!
              </p>
            </div>
          ) : (
            <div>
              {/* Calorie Status */}
              <div style={{ 
                background: exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories ? '#fff3cd' : '#d4edda',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '14px',
                border: `1px solid ${exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories ? '#ffc107' : '#28a745'}`
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories ? '#856404' : '#155724', 
                  marginBottom: '6px' 
                }}>
                  {exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories ? 'Need to Burn' : 'Under Target'}
                </div>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 700, 
                  color: exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories ? '#856404' : '#155724', 
                  marginBottom: '6px' 
                }}>
                  {Math.abs(exerciseRecs.caloriesConsumed - exerciseRecs.targetCalories)} kcal
                </div>
              </div>

              {/* Goal */}
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--text-soft)', 
                marginBottom: '10px',
                fontWeight: 500
              }}>
                🎯 {exerciseRecs.goal}
              </div>

              {/* Main Message */}
              <p style={{ 
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '12px',
                color: exerciseRecs.message.includes('✅') ? '#27ae60' : 'var(--text-main)'
              }}>
                {exerciseRecs.message}
              </p>

              {/* Show recommendations button if calories need to be burned */}
              {exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories && exerciseRecs.recommendations && exerciseRecs.recommendations.length > 0 ? (
                <button 
                  className="btn-primary"
                  onClick={() => setShowExerciseModal(true)}
                  style={{ width: '100%' }}
                >
                  🏃 View Exercise Recommendations
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Charts */}
      <section className="page-row">
        <div className="card charts-card">
          <div className="card-header">
            <div>
              <div className="card-title">Progress Charts</div>
            </div>
          </div>

          {/* Pass dynamic props so charts update */}
          <Charts
            dailyGoal={dailyGoal}
            caloriesConsumed={caloriesConsumed}
            caloriesBurned={caloriesBurned}
            proteinConsumed={proteinConsumed}
            carbsConsumed={carbsConsumed}
            fatConsumed={fatConsumed}
            nutritionHistory={nutritionHistory}
          />
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="page-row" aria-label="Quick navigation">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Navigation</div>
            </div>
          </div>

          <div className="grid-4">
            {quickNavItems.map((card) => (
              <div
                key={card.action}
                className="quick-nav-card"
                onClick={() => handleQuickNavClick(card.action)}
              >
                <div className="quick-nav-icon-wrap">{card.icon}</div>
                <div>
                  <div className="quick-nav-label">{card.label}</div>
                  <div className="quick-nav-sub">{card.sub}</div>
                </div>
                <div className="quick-nav-footer">
                  <span>{card.footer}</span>
                  <span className="quick-nav-arrow">↗</span>
                </div>
                <div className="quick-nav-glow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nutrition Log Modal */}
      {showNutritionLog && (
        <NutritionLog
          onClose={handleNutritionLogClose}
          jwt={jwt}
          caloriesConsumed={caloriesConsumed}
          caloriesBurned={caloriesBurned}
          dailyGoal={dailyGoal}
        />
      )}

      {/* Fitness Log Modal */}
      {showFitnessLog && (
        <FitnessLog
          onClose={handleFitnessLogClose}
          jwt={jwt}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Exercise Recommendations Modal */}
      {showExerciseModal && exerciseRecs && (
        <ExerciseModal
          onClose={() => setShowExerciseModal(false)}
          recommendations={exerciseRecs.recommendations || []}
          goal={exerciseRecs.goal || ''}
          message={exerciseRecs.message || ''}
          caloriesNeeded={Math.max(0, exerciseRecs.caloriesConsumed - exerciseRecs.targetCalories)}
        />
      )}
    </>
  );
}
