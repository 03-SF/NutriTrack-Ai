import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { API_BASE } from "../apiBase";

type DayData = {
  date: string;
  day: string;
  steps: number;
  calories: number;
  distance: number;
  heartPoints: number;
};

type WorkoutEntry = {
  _id: string;
  type: string;
  duration: number;
  intensity: string;
  caloriesBurned: number;
  notes?: string;
  timestamp: Date;
};

interface FitnessLogProps {
  onClose: () => void;
  jwt: string | null;
}

export default function FitnessLog({ onClose, jwt }: FitnessLogProps) {
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'steps' | 'calories' | 'distance'>('steps');
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [workoutForm, setWorkoutForm] = useState({
    type: 'running',
    duration: '',
    intensity: 'moderate',
    notes: ''
  });

  useEffect(() => {
    loadWeeklyFitness();
    loadWorkoutEntries();
  }, []);

  async function loadWorkoutEntries() {
    if (!jwt) return;
    
    try {
      console.log('🏋️ Loading today\'s workout entries...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const resp = await fetch(`${API_BASE}/api/workout/history?days=1`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Workout entries loaded:', data);
        
        // Filter to today only
        const todayWorkouts = data.workouts?.filter((w: any) => {
          const workoutDate = new Date(w.timestamp);
          workoutDate.setHours(0, 0, 0, 0);
          return workoutDate.getTime() === today.getTime();
        }) || [];
        
        setWorkoutEntries(todayWorkouts);
      } else {
        console.error('❌ Failed to load workout entries:', resp.status);
      }
    } catch (e) {
      console.error("❌ Failed to load workout entries:", e);
    }
  }

  async function loadWeeklyFitness() {
    if (!jwt) {
      console.error('❌ No JWT token available');
      return;
    }

    setLoading(true);
    try {
      console.log('📊 Fetching weekly fitness data...');
      console.log('🔑 JWT:', jwt.substring(0, 20) + '...');
      
      // Fetch last 7 days of data
      const promises = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const url = `${API_BASE}/api/fitness/day?date=${date.toISOString()}`;
        console.log(`📅 Fetching day ${i}:`, date.toLocaleDateString(), url);
        
        promises.push(
          fetch(url, {
            headers: { Authorization: `Bearer ${jwt}` }
          })
          .then(async r => {
            const data = await r.json();
            console.log(`📥 Day ${i} response:`, r.status, data);
            if (!r.ok) {
              console.error(`❌ Day ${i} failed:`, data);
              return {
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                steps: 0,
                calories: 0,
                distance: 0,
                heartPoints: 0
              };
            }
            return {
              date: date.toISOString().split('T')[0],
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              steps: data.parsed?.steps || 0,
              calories: Math.round(data.parsed?.calories || 0),
              distance: parseFloat(data.parsed?.distance || '0'),
              heartPoints: data.parsed?.heartPoints || 0
            };
          })
          .catch(err => {
            console.error(`❌ Day ${i} fetch error:`, err);
            return {
              date: date.toISOString().split('T')[0],
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              steps: 0,
              calories: 0,
              distance: 0,
              heartPoints: 0
            };
          })
        );
      }

      const results = await Promise.all(promises);
      console.log('✅ Weekly fitness data loaded:', results);
      setWeeklyData(results);
    } catch (e) {
      console.error('❌ Error loading weekly fitness:', e);
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totalSteps = weeklyData.reduce((sum, day) => sum + day.steps, 0);
  const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);
  const totalDistance = weeklyData.reduce((sum, day) => sum + day.distance, 0);
  const totalHeartPoints = weeklyData.reduce((sum, day) => sum + day.heartPoints, 0);
  const avgSteps = Math.round(totalSteps / (weeklyData.length || 1));
  const avgCalories = Math.round(totalCalories / (weeklyData.length || 1));

  async function deleteWorkout(id: string) {
    if (!jwt || !confirm('Delete this workout entry?')) return;
    
    try {
      const resp = await fetch(`${API_BASE}/api/workout/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (resp.ok) {
        console.log('✅ Workout deleted');
        loadWorkoutEntries();
        loadWeeklyFitness();
      } else {
        const error = await resp.json();
        alert('Failed to delete: ' + error.error);
      }
    } catch (e) {
      console.error('❌ Delete error:', e);
      alert('Failed to delete workout');
    }
  }

  async function handleAddWorkout(e: React.FormEvent) {
    e.preventDefault();
    
    if (!jwt) {
      alert('Please log in to add workouts');
      return;
    }

    if (!workoutForm.duration || parseFloat(workoutForm.duration) <= 0) {
      alert('Please enter a valid duration');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/workout/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          type: workoutForm.type,
          duration: parseFloat(workoutForm.duration),
          intensity: workoutForm.intensity,
          notes: workoutForm.notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add workout');
      }

      alert(`✅ Workout logged successfully!\n${data.workout.caloriesBurned} calories burned`);
      setShowAddWorkout(false);
      setWorkoutForm({ type: 'running', duration: '', intensity: 'moderate', notes: '' });
      loadWeeklyFitness(); // Refresh data
      loadWorkoutEntries(); // Refresh today's entries
    } catch (err: any) {
      console.error('Add workout error:', err);
      alert('Failed to log workout: ' + err.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fitness-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏃 Fitness Log - Last 7 Days</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowAddWorkout(!showAddWorkout)}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {showAddWorkout ? '❌ Cancel' : <span><span className="emoji-dark-grey">➕</span> Log Workout</span>}
            </button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          {/* Manual Workout Form */}
          {showAddWorkout && (
            <div className="add-workout-form" style={{ 
              background: 'linear-gradient(135deg, #86efac 0%, #ADD0B3 100%)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              color: 'white'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📝 Log Manual Workout</h3>
              <form onSubmit={handleAddWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Exercise Type</label>
                    <select
                      value={workoutForm.type}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, type: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none' }}
                    >
                      <option value="running">🏃 Running</option>
                      <option value="walking">🚶 Walking</option>
                      <option value="cycling">🚴 Cycling</option>
                      <option value="swimming">🏊 Swimming</option>
                      <option value="weightlifting">🏋️ Weightlifting</option>
                      <option value="yoga">🧘 Yoga</option>
                      <option value="dance">💃 Dance</option>
                      <option value="basketball">🏀 Basketball</option>
                      <option value="football">⚽ Football</option>
                      <option value="tennis">🎾 Tennis</option>
                      <option value="hiking">🥾 Hiking</option>
                      <option value="rowing">🚣 Rowing</option>
                      <option value="jumpingRope">🪢 Jumping Rope</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Duration (minutes)</label>
                    <input
                      type="number"
                      value={workoutForm.duration}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, duration: e.target.value })}
                      placeholder="30"
                      min="1"
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Intensity</label>
                  <select
                    value={workoutForm.intensity}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, intensity: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none' }}
                  >
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="vigorous">Vigorous</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Notes (optional)</label>
                  <input
                    type="text"
                    value={workoutForm.notes}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                    placeholder="Morning run in the park"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ 
                    background: 'white',
                    color: '#86efac',
                    padding: '10px',
                    fontWeight: 'bold',
                    marginTop: '5px'
                  }}
                >
                  ✅ Log Workout
                </button>
              </form>
            </div>
          )}

          {/* Today's Manual Workouts Section */}
          <div className="food-entries-section" style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <h3>📋 Today's Manual Workouts ({workoutEntries.length} entries)</h3>
            </div>

            <div className="food-entries-list">
              {workoutEntries.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>No manual workouts logged today</p>
                  <p className="empty-subtitle">Click "<span className="emoji-dark-grey" style={{ color: '#4b5563' }}>➕</span> Log Workout" to track your exercises</p>
                </div>
              ) : (
                workoutEntries.map((entry) => (
                  <div key={entry._id} className="food-entry-card">
                    <div className="food-entry-main">
                      <div className="food-name">
                        {entry.type === 'running' && '🏃'}
                        {entry.type === 'walking' && '🚶'}
                        {entry.type === 'cycling' && '🚴'}
                        {entry.type === 'swimming' && '🏊'}
                        {entry.type === 'weightlifting' && '🏋️'}
                        {entry.type === 'yoga' && '🧘'}
                        {entry.type === 'dance' && '💃'}
                        {entry.type === 'basketball' && '🏀'}
                        {entry.type === 'football' && '⚽'}
                        {entry.type === 'tennis' && '🎾'}
                        {entry.type === 'hiking' && '🥾'}
                        {entry.type === 'rowing' && '🚣'}
                        {entry.type === 'jumpingRope' && '🪢'}
                        {!['running', 'walking', 'cycling', 'swimming', 'weightlifting', 'yoga', 'dance', 'basketball', 'football', 'tennis', 'hiking', 'rowing', 'jumpingRope'].includes(entry.type) && '🏃'}
                        {' '}
                        {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                      </div>
                      <div className="food-calories">{Math.round(entry.caloriesBurned)} kcal</div>
                    </div>
                    <div className="food-macros">
                      <span>⏱️ {entry.duration} min</span>
                      <span>💪 {entry.intensity}</span>
                      {entry.notes && <span>📝 {entry.notes}</span>}
                    </div>
                    <button 
                      className="btn-delete" 
                      onClick={() => deleteWorkout(entry._id)}
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Loading fitness data...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="fitness-summary-grid">
                <div className="fitness-stat-card">
                  <div className="stat-icon">👟</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Steps</div>
                    <div className="stat-value">{totalSteps.toLocaleString()}</div>
                    <div className="stat-subtitle">Avg: {avgSteps.toLocaleString()}/day</div>
                  </div>
                </div>

                <div className="fitness-stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-content">
                    <div className="stat-label">Calories Burned</div>
                    <div className="stat-value">{totalCalories.toLocaleString()}</div>
                    <div className="stat-subtitle">Avg: {avgCalories}/day</div>
                  </div>
                </div>

                <div className="fitness-stat-card">
                  <div className="stat-icon">📍</div>
                  <div className="stat-content">
                    <div className="stat-label">Distance</div>
                    <div className="stat-value">{totalDistance.toFixed(2)} km</div>
                    <div className="stat-subtitle">This week</div>
                  </div>
                </div>

                <div className="fitness-stat-card">
                  <div className="stat-icon">❤️</div>
                  <div className="stat-content">
                    <div className="stat-label">Heart Points</div>
                    <div className="stat-value">{totalHeartPoints}</div>
                    <div className="stat-subtitle">Weekly total</div>
                  </div>
                </div>
              </div>

              {/* Metric Selector */}
              <div className="metric-selector">
                <button
                  className={`metric-btn ${selectedMetric === 'steps' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('steps')}
                >
                  👟 Steps
                </button>
                <button
                  className={`metric-btn ${selectedMetric === 'calories' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('calories')}
                >
                  🔥 Calories
                </button>
                <button
                  className={`metric-btn ${selectedMetric === 'distance' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('distance')}
                >
                  📍 Distance
                </button>
              </div>

              {/* Main Chart */}
              <div className="fitness-chart-container">
                <h3>
                  {selectedMetric === 'steps' && '👟 Daily Steps'}
                  {selectedMetric === 'calories' && '🔥 Calories Burned'}
                  {selectedMetric === 'distance' && '📍 Distance Covered'}
                </h3>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#86efac" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#86efac" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(189,195,200,0.3)" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: "#666", fontSize: 12 }}
                      stroke="#bdc3c8"
                    />
                    <YAxis 
                      tick={{ fill: "#666", fontSize: 12 }}
                      stroke="#bdc3c8"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #bdc3c8",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#22c55e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMetric)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Breakdown */}
              <div className="daily-breakdown">
                <h3>📅 Daily Breakdown</h3>
                <div className="breakdown-table">
                  <div className="breakdown-header">
                    <div>Day</div>
                    <div>Steps</div>
                    <div>Calories</div>
                    <div>Distance</div>
                  </div>
                  {weeklyData.map((day, idx) => (
                    <div key={idx} className="breakdown-row">
                      <div className="breakdown-day">
                        <span className="day-name">{day.day}</span>
                        <span className="day-date">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="breakdown-value">{day.steps.toLocaleString()}</div>
                      <div className="breakdown-value">{day.calories} kcal</div>
                      <div className="breakdown-value">{day.distance.toFixed(2)} km</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Metrics Bar Chart */}
              <div className="fitness-chart-container">
                <h3>📊 Weekly Overview - All Metrics</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(189,195,200,0.3)" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: "#666", fontSize: 12 }}
                      stroke="#bdc3c8"
                    />
                    <YAxis 
                      tick={{ fill: "#666", fontSize: 12 }}
                      stroke="#bdc3c8"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #bdc3c8",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="steps" fill="#86efac" name="Steps" />
                    <Bar dataKey="calories" fill="#ADD0B3" name="Calories" />
                    <Bar dataKey="heartPoints" fill="#22c55e" name="Heart Points" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
