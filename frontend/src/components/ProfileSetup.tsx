// ProfileSetup.tsx
import * as React from "react";
import axios from "axios";
import { API_BASE } from "../apiBase";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [formData, setFormData] = React.useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "",
  });

  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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

    setLoading(true);

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
        console.log("✅ Profile saved successfully");
        onComplete();
      }
    } catch (err: any) {
      console.error("Profile setup error:", err);
      setError(err.response?.data?.error || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-screen">
      <div className="profile-setup-container">
        <div className="profile-header">
          <h1 className="profile-title">Complete Your Profile</h1>
          <p className="profile-subtitle">
            Help us personalize your wellness journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
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
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Weight</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="profile-info-box">
            <p className="info-text">
              💡 These values help us calculate your personalized daily calorie goal,
              macro ratios, and provide accurate AI-powered recommendations.
            </p>
          </div>

          <button 
            type="submit" 
            className="profile-submit-btn" 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save & Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
