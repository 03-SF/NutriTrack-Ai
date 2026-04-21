interface TopNavProps {
  onToggleSidebar: () => void;
  onLogout?: () => void;
  lastSyncTime?: string;
  userName?: string;
  userEmail?: string;
}

export default function TopNav({ onToggleSidebar, onLogout, lastSyncTime = 'just now', userName = 'User', userEmail = '' }: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <button
          id="hamburger"
          className="hamburger-btn"
          type="button"
          aria-label="Toggle navigation"
          onClick={onToggleSidebar}
        >
          <div className="hamburger-lines">
            <span />
            <span />
            <span />
          </div>
        </button>

        <div className="page-header-text">
          <h1 className="page-title">Today’s Overview</h1>
          <p className="page-subtitle">
            Track your calories, streaks, and progress at a glance.
          </p>
        </div>
      </div>

      <div className="top-nav-right">
        <div className="pill-indicator">
          <span className="pill-dot" />
          <span>Synced {lastSyncTime}</span>
        </div>

        {onLogout && (
          <button className="logout-btn" type="button" onClick={onLogout}>
            <span className="icon">⏻</span>
            <span>Logout</span>
          </button>
        )}

        <div className="user-menu" title="Account menu">
          <div className="avatar">{userName.substring(0, 2).toUpperCase()}</div>
          <div className="user-meta">
            <span className="user-name">{userName}</span>
            <span className="user-role">{userEmail || 'Member'}</span>
          </div>
          <span className="chevron">▾</span>
        </div>
      </div>
    </header>
  );
}
