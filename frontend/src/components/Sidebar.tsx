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
          background: 'linear-gradient(135deg, #86efac 0%, #16a34a 100%)',
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
            background: 'rgba(134, 239, 172, 0.1)',
            borderRadius: '20px',
            position: 'relative'
          }}
        >
          <span className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span>
          <span className="label">Dashboard</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('nutrition')}
        >
          <span className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path><circle cx="12" cy="12" r="8" fill="none"></circle></svg></span>
          <span className="label">Nutrition Log</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('fitness')}
        >
          <span className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h2v16H6zM16 4h2v16h-2z"></path><rect x="9" y="6" width="6" height="12" rx="1"></rect></svg></span>
          <span className="label">Fitness Log</span>
        </button>
        <button 
          className="nav-item" 
          type="button"
          onClick={() => onNavigate?.('ai-insights')}
        >
          <span className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><circle cx="9" cy="10" r="1"></circle><circle cx="12" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle></svg></span>
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
          <span className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path></svg></span>
          <span className="label">Settings</span>
        </button>
        {onLogout && (
          <button className="nav-item" type="button" onClick={onLogout}>
            <span className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path></svg></span>
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
