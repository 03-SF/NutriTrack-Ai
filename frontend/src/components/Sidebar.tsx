interface SidebarProps {
  open: boolean;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
  dailyGoal?: number;
  userName?: string;
}

export default function Sidebar({ open, onLogout, onNavigate, dailyGoal = 2200, userName = 'User' }: SidebarProps) {
  return (
    <aside id="sidebar" className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-mark">N</div>
        <div className="sidebar-header-text">
          <div className="app-name-main">NutriTrack AI</div>
        </div>
      </div>

      <div className="sidebar-section-title">Main</div>
      <nav className="sidebar-nav">
        <button 
          className="nav-item active" 
          type="button"
          onClick={() => onNavigate?.('dashboard')}
        >
          <span className="icon">📊</span>
          <span className="label">Dashboard</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('nutrition')}
        >
          <span className="icon">🥦</span>
          <span className="label">Nutrition Log</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('fitness')}
        >
          <span className="icon">🏃‍♂️</span>
          <span className="label">Fitness Log</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('ai-insights')}
        >
          <span className="icon">🤖</span>
          <span className="label">AI Insights</span>
        </button>
      </nav>

      <div className="sidebar-section-title">Account</div>
      <div className="sidebar-secondary">
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('settings')}
        >
          <span className="icon">⚙️</span>
          <span className="label">Settings</span>
        </button>
        {onLogout && (
          <button className="nav-item" type="button" onClick={onLogout}>
            <span className="icon">🚪</span>
            <span className="label">Logout</span>
          </button>
        )}
      </div>

      <div className="sidebar-footer">
        <div>
          Daily focus:{" "}
          <span className="sidebar-footer-highlight">
            Stay within your {dailyGoal.toLocaleString()} kcal goal
          </span>
        </div>
        <div>Tip: Log meals before you eat for better awareness.</div>
      </div>
    </aside>
  );
}
