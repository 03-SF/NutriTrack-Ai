// WelcomeScreen.tsx
import * as React from "react";

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-icon">🎉</div>
        <h1 className="welcome-title">Welcome to NutriTrack AI</h1>
        <p className="welcome-subtitle">Your Personal Digital Wellness Companion</p>
        
        <div className="welcome-description">
          <p>
            Let's personalize your experience so we can recommend accurate 
            calorie goals, nutrition insights, and fitness plans tailored just for you.
          </p>
        </div>

        <div className="welcome-features">
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <span>Personalized Calorie Goals</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>AI-Powered Insights</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💪</span>
            <span>Custom Fitness Plans</span>
          </div>
        </div>

        <button className="continue-btn" onClick={onContinue}>
          Continue to Setup →
        </button>
      </div>
    </div>
  );
}
