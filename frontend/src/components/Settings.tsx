// Settings.tsx
import * as React from "react";
import axios from "axios";
import { API_BASE } from "../apiBase";

interface SettingsProps {
  onClose: () => void;
}

interface ProfileData {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  dailyCalorieGoal: number;
  isProfileComplete: boolean;
}

export default function Settings({ onClose }: SettingsProps) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  
  const [formData, setFormData] = React.useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "",
  });

  const [currentCalorieGoal, setCurrentCalorieGoal] = React.useState(0);

  // Fetch current profile on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          setError("Not authenticated");
          return;
        }

        const response = await axios.get(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profile: ProfileData = response.data.profile;
        
        if (profile && profile.isProfileComplete) {
          setFormData({
            age: profile.age?.toString() || "",
            gender: profile.gender || "",
            height: profile.height?.toString() || "",
            weight: profile.weight?.toString() || "",
            activityLevel: profile.activityLevel || "",
            goal: profile.goal || "",
          });
          setCurrentCalorieGoal(profile.dailyCalorieGoal || 0);
        }
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validation
    if (!formData.age || !formData.gender || !formData.height || 
        !formData.weight || !formData.activityLevel || !formData.goal) {
      setError("Please fill in all fields");
      return;
    }

    const age = parseInt(formData.age);
    const height = parseInt(formData.height);
    const weight = parseFloat(formData.weight);

    if (age < 13 || age > 120) {
      setError("Age must be between 13 and 120");
      return;
    }

    if (height < 100 || height > 250) {
      setError("Height must be between 100 and 250 cm");
      return;
    }

    if (weight < 30 || weight > 300) {
      setError("Weight must be between 30 and 300 kg");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setError("Not authenticated. Please login again.");
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/profile/setup`,
        {
          age,
          gender: formData.gender,
          height,
          weight,
          activityLevel: formData.activityLevel,
          goal: formData.goal,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccessMessage("Profile updated successfully! 🎉");
        setCurrentCalorieGoal(response.data.profile.dailyCalorieGoal);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
          window.location.reload(); // Refresh to update dashboard
        }, 2000);
      }
    } catch (err: any) {
      console.error("Settings save error:", err);
      setError(err.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div>
            <h2 className="settings-title">Profile & Settings</h2>
            <p className="settings-subtitle">Manage your goals and preferences</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {currentCalorieGoal > 0 && (
            <div className="calorie-goal-banner">
              <div className="goal-icon">🎯</div>
              <div>
                <div className="goal-label">Your Daily Calorie Goal</div>
                <div className="goal-value">{currentCalorieGoal.toLocaleString()} kcal</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">Age *</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g., 25"
                    min="13"
                    max="120"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="height">Height (cm) *</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="e.g., 170"
                    min="100"
                    max="250"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weight">Weight (kg) *</label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 70"
                    min="30"
                    max="300"
                    step="0.1"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Activity & Goals</h3>
              
              <div className="form-group">
                <label htmlFor="activityLevel">Activity Level *</label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Activity Level</option>
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                  <option value="moderate">Moderately Active (3-5 days/week)</option>
                  <option value="very_active">Very Active (6-7 days/week)</option>
                  <option value="extra_active">Extra Active (athlete level)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="goal">Your Goal *</label>
                <select
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Your Goal</option>
                  <option value="lose">Lose Weight (500 cal deficit)</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight (500 cal surplus)</option>
                </select>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <div className="settings-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
