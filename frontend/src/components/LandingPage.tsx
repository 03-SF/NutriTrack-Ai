interface LandingPageProps {
  onNavigate: (page: 'login' | 'signup') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">🥗</span>
            <span className="logo-text">NutriTrack AI</span>
          </div>
          <div className="nav-actions">
            <button className="btn-nav" onClick={() => onNavigate('login')}>
              Log In
            </button>
            <button className="btn-primary" onClick={() => onNavigate('signup')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Personal
              <span className="hero-highlight"> AI-Powered </span>
              Nutrition & Fitness Tracker
            </h1>
            <p className="hero-subtitle">
              Seamlessly track calories, sync with Google Fit, and get personalized insights 
              to achieve your health goals—all in one beautiful dashboard.
            </p>
            <div className="hero-buttons">
              <button className="btn-hero-primary" onClick={() => onNavigate('signup')}>
                Start Free Today
              </button>
              <button className="btn-hero-secondary" onClick={() => onNavigate('login')}>
                Sign In
              </button>
            </div>
            <p className="hero-note">
              ✨ No credit card required • 🔒 Your data stays private
            </p>
          </div>
          
          <div className="hero-visual">
            <div className="hero-card-wrapper">
              {/* Header */}
              <div className="hero-card-header">
                <div className="hero-card-title">
                  <span className="pulse-dot"></span>
                  <span>Today's Progress</span>
                </div>
                <div className="hero-card-date">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </div>

              {/* Main Stats Grid */}
              <div className="hero-stats-grid">
                <div className="hero-stat-card primary">
                  <div className="hero-stat-icon">🔥</div>
                  <div className="hero-stat-info">
                    <div className="hero-stat-label">Calories</div>
                    <div className="hero-stat-value">2,145</div>
                    <div className="hero-stat-progress">
                      <div className="hero-progress-bar">
                        <div className="hero-progress-fill" style={{ width: '72%' }}></div>
                      </div>
                      <span className="hero-progress-text">72% of goal</span>
                    </div>
                  </div>
                </div>

                <div className="hero-stat-card secondary">
                  <div className="hero-stat-icon">👟</div>
                  <div className="hero-stat-info">
                    <div className="hero-stat-label">Steps</div>
                    <div className="hero-stat-value">8,432</div>
                    <div className="hero-stat-progress">
                      <div className="hero-progress-bar">
                        <div className="hero-progress-fill" style={{ width: '84%' }}></div>
                      </div>
                      <span className="hero-progress-text">84% of 10K</span>
                    </div>
                  </div>
                </div>

                <div className="hero-stat-card tertiary">
                  <div className="hero-stat-icon">💪</div>
                  <div className="hero-stat-info">
                    <div className="hero-stat-label">Protein</div>
                    <div className="hero-stat-value">85g</div>
                    <div className="hero-stat-progress">
                      <div className="hero-progress-bar">
                        <div className="hero-progress-fill" style={{ width: '68%' }}></div>
                      </div>
                      <span className="hero-progress-text">68% of 125g</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Footer */}
              <div className="hero-card-footer">
                <div className="hero-footer-stat">
                  <span className="hero-footer-icon">⚡</span>
                  <span className="hero-footer-value">1,856 kcal</span>
                  <span className="hero-footer-label">burned</span>
                </div>
                <div className="hero-footer-divider"></div>
                <div className="hero-footer-stat">
                  <span className="hero-footer-icon">🎯</span>
                  <span className="hero-footer-value">4.2 km</span>
                  <span className="hero-footer-label">walked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <p className="section-subtitle">
            Powerful features designed to make nutrition tracking effortless
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3 className="feature-title">Smart Food Logging</h3>
              <p className="feature-description">
                Search from thousands of foods with complete nutritional information. 
                Add meals in seconds with our intelligent search.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Beautiful Analytics</h3>
              <p className="feature-description">
                Visualize your progress with interactive charts and insights. 
                Track calories, macros, and fitness metrics over time.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3 className="feature-title">Google Fit Integration</h3>
              <p className="feature-description">
                Automatically sync steps, calories burned, and activities from your 
                phone. No manual entry needed.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI-Powered Insights</h3>
              <p className="feature-description">
                Get personalized recommendations based on your eating patterns, 
                activity levels, and health goals.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Goal Tracking</h3>
              <p className="feature-description">
                Set custom calorie and macro targets. Monitor your progress with 
                real-time updates and motivating insights.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Mobile Optimized</h3>
              <p className="feature-description">
                Access your dashboard anywhere, anytime. Fully responsive design 
                works perfectly on all devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Transform Your Health?</h2>
          <p className="cta-subtitle">
            Join thousands of users who are already achieving their fitness goals with NutriTrack AI
          </p>
          <button className="btn-cta" onClick={() => onNavigate('signup')}>
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-icon">🥗</span>
              <span className="logo-text">NutriTrack AI</span>
            </div>
            <p className="footer-text">
              © 2025 NutriTrack AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
