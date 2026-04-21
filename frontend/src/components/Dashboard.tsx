import { useEffect, useMemo, useState } from "react";
import Charts from "./Charts";
import NutritionLog from "./NutritionLog";
import FitnessLog from "./FitnessLog";
import Settings from "./Settings";
import ExerciseModal from "./ExerciseModal";

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

// API base
const API_BASE =
  (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5000";

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
      const resp = await fetch(`${API_BASE}/api/fitness/today`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error('❌ API Error:', resp.status, t);
        throw new Error(`API error: ${resp.status} ${t}`);
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
      {/* Welcome Message */}
      {userInfo && (
        <div style={{ marginBottom: '1rem', padding: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
            {isFirstTime ? `Welcome to NutriTrack, ${userInfo.name}! 🎉` : `Welcome back, ${userInfo.name}! 👋`}
          </h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            {isFirstTime 
              ? `Your daily calorie goal is ${dailyGoal} kcal. Let's start tracking your nutrition and fitness!` 
              : 'Track your progress and stay healthy'
            }
          </p>
          {isFirstTime && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontSize: '0.875rem' }}>
              <strong>🚀 Quick Start Tips:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', paddingLeft: 0 }}>
                <li>Start by logging your first meal using the Nutrition Log</li>
                <li>Connect Google Fit to track your daily steps and activities</li>
                <li>Check back daily to see your progress and trends</li>
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Row: Calorie + Streak + Tip */}
      <section className="page-row grid">
        {/* Daily Calorie Balance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Daily Calorie Balance</div>
              <div className="card-subtitle">
                Stay aligned with your goal and keep your intake balanced.
              </div>
            </div>
            <span className="badge-soft">
              Goal: <span id="dailyGoalLabel">{dailyGoal.toLocaleString()} kcal</span>
            </span>
          </div>

          <div className="calorie-card">
            {/* Circular Gauge */}
            <div
              className="gauge-wrapper"
              style={{ ["--progress" as string]: gaugeProgress }}
            >
              <div className="gauge-inner">
                <div className="gauge-label">Remaining</div>
                <div className="gauge-value" id="remainingKcal">
                  {caloriesRemaining.toLocaleString()}
                </div>
                <div className="gauge-caption">kcal left today</div>
              </div>
              <div className="gauge-dot" />
            </div>

            {/* Calorie Details */}
            <div className="calorie-details">
              <div className="calorie-rows">
                <div className="cal-row">
                  <div className="cal-label">🍽️ Consumed</div>
                  <div className="cal-value" id="calConsumed">
                    {caloriesConsumed.toLocaleString()}
                  </div>
                  <div className="cal-unit">kcal</div>
                </div>

                <div className="cal-row" style={{ 
                  borderTop: '1px solid rgba(0,0,0,0.05)', 
                  paddingTop: '8px',
                  marginTop: '8px'
                }}>
                  <div className="cal-label">📊 Net Calories</div>
                  <div className="cal-value" style={{ 
                    color: caloriesNet > dailyGoal ? '#e74c3c' : '#2ecc71' 
                  }}>
                    {caloriesNet.toLocaleString()}
                  </div>
                  <div className="cal-unit">kcal</div>
                </div>

                {caloriesNet > dailyGoal && (
                  <div className="cal-row" style={{ 
                    background: 'rgba(231, 76, 60, 0.05)',
                    padding: '8px',
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}>
                    <div className="cal-label" style={{ fontSize: '0.9em' }}>
                      💪 Need to burn
                    </div>
                    <div className="cal-value" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                      {(caloriesNet - dailyGoal).toLocaleString()}
                    </div>
                    <div className="cal-unit" style={{ fontSize: '0.9em' }}>more kcal</div>
                  </div>
                )}

                {caloriesNet <= dailyGoal && (
                  <div className="cal-row">
                    <div className="cal-label">⚡ Can consume</div>
                    <div className="cal-value" id="calRemainingRow" style={{ color: '#2ecc71' }}>
                      {caloriesRemaining.toLocaleString()}
                    </div>
                    <div className="cal-unit">more kcal</div>
                  </div>
                )}
              </div>

              <div className="cal-progress-label">
                <span>Daily goal completion</span>
                <span>
                  <strong id="dailyCompletion">{completionPercent}%</strong> of target
                </span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  id="dailyProgressFill"
                  style={{ width: `${Math.min(completionPercent, 100)}%` }}
                />
              </div>

              {/* Fitness Activity Summary */}
              <div className="fitness-summary">
                <div className="fitness-summary-header">
                  <span className="card-title">Fitness Activity (Today)</span>
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
                
                {/* Google Fit Connection Status */}
                {!jwt ? (
                  <div className="alert-info" style={{ marginBottom: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>⚠️ Not Connected</p>
                    <p style={{ marginBottom: '0.5rem' }}>Connect your Google Fit account to sync data from your phone</p>
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        try {
                          console.log('🔄 Fetching OAuth URL...');
                          const resp = await fetch(`${API_BASE}/api/auth/google/url`);
                          if (!resp.ok) {
                            throw new Error('Backend server not responding');
                          }
                          const { url } = await resp.json();
                          console.log('✅ Redirecting to Google OAuth...');
                          window.location.href = url;
                        } catch (e) {
                          console.error('❌ Failed to get OAuth URL:', e);
                          alert('Error: Cannot connect to backend server. Make sure it is running on port 5000.');
                        }
                      }}
                    >
                      🔗 Connect Google Fit
                    </button>
                  </div>
                ) : (
                  <div className="fitness-status-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="status-dot"></span>
                      <span>Connected - Syncing data from Google Fit</span>
                    </div>
                    <button
                      className="btn-refresh"
                      onClick={async () => {
                        // Clear JWT and reconnect
                        localStorage.removeItem('jwt');
                        setJwtState(null);
                        alert('🔄 Disconnected. Click "Connect Google Fit" to reconnect.');
                        window.location.reload();
                      }}
                    >
                      🔄 Reconnect
                    </button>
                  </div>
                )}
                
                {fitnessError && (
                  <div className="alert-error">{fitnessError}</div>
                )}
                
                <div className="fitness-summary-body">
                  <div className="fitness-metric-card">
                    <div className="metric-icon">👟</div>
                    <div className="metric-content">
                      <div className="metric-label">Steps</div>
                      <div className="metric-value">{steps.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="fitness-metric-card">
                    <div className="metric-icon">🔥</div>
                    <div className="metric-content">
                      <div className="metric-label">Calories Burned</div>
                      <div className="metric-value">{caloriesBurned.toLocaleString()} <span className="metric-unit">kcal</span></div>
                      {(googleFitCalories > 0 || manualWorkoutCalories > 0) && (
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                          {googleFitCalories > 0 && `Google Fit: ${googleFitCalories}`}
                          {googleFitCalories > 0 && manualWorkoutCalories > 0 && ' | '}
                          {manualWorkoutCalories > 0 && `Manual: ${manualWorkoutCalories}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="fitness-metric-card">
                    <div className="metric-icon">📍</div>
                    <div className="metric-content">
                      <div className="metric-label">Distance</div>
                      <div className="metric-value">{distance} <span className="metric-unit">km</span></div>
                    </div>
                  </div>
                  <div className="fitness-metric-card">
                    <div className="metric-icon">❤️</div>
                    <div className="metric-content">
                      <div className="metric-label">Heart Points</div>
                      <div className="metric-value">{Math.round(heartPoints)}</div>
                    </div>
                  </div>
                  {fitness?.parsed?.activities && fitness.parsed.activities.length > 0 && (
                    <>
                      <div className="fitness-row" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                        <span>🏃 Activities</span>
                        <span>{fitness.parsed.activities.length}</span>
                      </div>
                      <ul className="workout-list">
                        {fitness.parsed.activities.slice(0, 3).map((activity: any, idx: number) => (
                          <li key={idx}>
                            {activity.name} — {Math.round(activity.duration / 60000)} min
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                
                {!jwt && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#888' }}>
                    ⚠️ Not connected - Click button above to connect
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Streak Widget */}
        <div className="grid-2">
          {/* Streak Widget */}
          <div className="streak-card">
            <div className="streak-header">
              <div className="streak-main">
                <div className="streak-icon" aria-hidden="true">
                  🔥
                </div>
                <div className="streak-text">
                  <span className="streak-label">Login Streak</span>
                  <span className="streak-value">
                    <span id="streakDays">{loginStreak}</span> {loginStreak === 1 ? 'day' : 'days'}
                  </span>
                  <span className="streak-meta">
                    {longestLoginStreak > loginStreak 
                      ? `Longest: ${longestLoginStreak} days` 
                      : loginStreak > 0 
                        ? 'Personal best! 🎉' 
                        : 'Start your streak today!'}
                  </span>
                </div>
              </div>
              <div className="streak-tag">
                {loginStreak >= 7 
                  ? 'Amazing consistency!' 
                  : loginStreak >= 3 
                    ? 'Keep it going!' 
                    : 'Build your habit'}
              </div>
            </div>
            
            {/* Goal Completion Streak Section */}
            <div className="streak-divider" />
            <div className="streak-footer">
              <div className="streak-secondary">
                <span className="streak-secondary-icon">🎯</span>
                <div>
                  <div className="streak-secondary-label">Goal Completion Streak</div>
                  <div className="streak-secondary-value">
                    {goalStreak} {goalStreak === 1 ? 'day' : 'days'}
                  </div>
                  <div className="streak-secondary-meta">
                    {goalStreak > 0 
                      ? `Meeting your ${dailyGoal} cal goal daily!` 
                      : 'Complete your daily calorie goal to start'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="streak-bg-band" />
          </div>

          {/* Exercise Recommendations Card */}
          <div className="tip-card" style={{ display: 'flex', flexDirection: 'column', maxWidth: '420px' }}>
            <div className="tip-header" style={{ marginBottom: '12px', flexShrink: 0 }}>
              <div className="tip-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className="tip-icon">🎯</span>
                Today's Exercise Suggestion
              </div>
            </div>

            {loadingRecs ? (
              <div className="tip-content">
                <p className="tip-message" style={{ textAlign: 'center', padding: '20px 0' }}>
                  ⏳ Analyzing your data...
                </p>
              </div>
            ) : !exerciseRecs ? (
              <div className="tip-content">
                <p className="tip-message" style={{ textAlign: 'center', opacity: 0.7 }}>
                  Complete your profile and log meals to get recommendations!
                </p>
              </div>
            ) : (
              <div className="tip-content" style={{ paddingTop: '0' }}>
                {/* Calorie Status */}
                <div style={{ 
                  background: exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories ? '#fff3cd' : '#d4edda',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
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
                  <div style={{ 
                    fontSize: '11px', 
                    color: exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories ? '#856404' : '#155724'
                  }}>
                    Consumed: {exerciseRecs.caloriesConsumed || 0} kcal
                  </div>
                </div>

                {/* Goal */}
                <div style={{ 
                  fontSize: '13px', 
                  color: '#495057', 
                  marginBottom: '10px',
                  fontWeight: 500
                }}>
                  🎯 {exerciseRecs.goal}
                </div>

                {/* Main Message */}
                <p className="tip-message" style={{ 
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: exerciseRecs.message.includes('✅') ? '#27ae60' : '#2c3e50'
                }}>
                  {exerciseRecs.message}
                </p>

                {/* Show recommendations button if calories need to be burned */}
                {exerciseRecs.caloriesConsumed > exerciseRecs.targetCalories && exerciseRecs.recommendations && exerciseRecs.recommendations.length > 0 ? (
                  <button 
                    className="btn-primary"
                    onClick={() => setShowExerciseModal(true)}
                    style={{ width: '100%', marginBottom: '12px' }}
                  >
                    🏃 View Exercise Recommendations
                  </button>
                ) : null}

                {/* Exercise Recommendations - Hidden, will show in modal */}
                <div style={{ display: 'none', gap: '8px' }}>
                  {exerciseRecs.recommendations.map((rec: any, idx: number) => (
                    <div 
                      key={idx}
                      style={{
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>{rec.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#2c3e50' }}>
                            {rec.exercise}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                            {rec.reason}
                          </div>
                          {rec.exercises && (
                            <div style={{ fontSize: '10px', color: '#868e96', marginTop: '2px' }}>
                              {rec.exercises.join(', ')}
                            </div>
                          )}
                          {rec.stepTarget && (
                            <div style={{ fontSize: '10px', color: '#868e96', marginTop: '2px' }}>
                              Target: {rec.stepTarget.toLocaleString()} steps
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#495057' }}>
                          {rec.duration} min
                        </div>
                        <div style={{ fontSize: '11px', color: '#6c757d' }}>
                          ~{rec.calories} kcal
                        </div>
                        <div style={{ 
                          fontSize: '9px', 
                          color: 'white',
                          background: rec.intensity === 'Very High' || rec.intensity === 'High' ? '#e74c3c' : 
                                     rec.intensity === 'Moderate' ? '#f39c12' : '#27ae60',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          {rec.intensity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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