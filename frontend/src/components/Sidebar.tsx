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
        <div className="logo-mark" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #16a34a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 700
        }}>N</div>
        <div className="sidebar-header-text">
          <div className="app-name-main">NUTRITRACK AI</div>
        </div>
      </div>

      <div className="sidebar-section-title">MAIN</div>
      <nav className="sidebar-nav">
        <button 
          className="nav-item active" 
          type="button"
          onClick={() => onNavigate?.('dashboard')}
          style={{
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '20px',
            position: 'relative'
          }}
        >
          <span className="icon">📊</span>
          <span className="label">Dashboard</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('nutrition')}
        >
          <span className="icon">🥬</span>
          <span className="label">Nutrition Log</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('fitness')}
        >
          <span className="icon">⛹️</span>
          <span className="label">Fitness Log</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('ai-insights')}
        >
          <span className="icon">🧠</span>
          <span className="label">AI Insights</span>
        </button>
      </nav>

      <div className="sidebar-section-title">ACCOUNT</div>
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

      <div className="sidebar-footer" style={{
        background: 'rgba(102, 126, 234, 0.08)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: 'auto'
      }}>
        <div style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '8px' }}>
          <span style={{ color: '#666' }}>Daily focus: </span>
          <span style={{ color: '#667eea', fontWeight: 600 }}>
            Stay within your {dailyGoal.toLocaleString()} kcal goal
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
          Tip: Log meals before you eat for better awareness.
        </div>
      </div>
    </aside>
  );
}
