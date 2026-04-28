import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
    {
        section: 'Operations', items: [
            { to: '/', label: 'Dashboard', icon: '◆' },
            { to: '/survey', label: 'Survey Intake', icon: '◇' },
            { to: '/needs', label: 'Needs Intel', icon: '▤' },
            { to: '/volunteers', label: 'Volunteers', icon: '▥' },
            { to: '/match', label: 'Match Engine', icon: '⬡' },
            { to: '/field-ops', label: 'Field Ops', icon: '▦' },
        ]
    },
    {
        section: 'Intelligence', items: [
            { to: '/heatmap', label: 'Heatmap', icon: '▣' },
            { to: '/zones', label: 'Zone Map', icon: '◫' },
            { to: '/reports', label: 'Reports', icon: '▧' },
            { to: '/alerts', label: 'Alerts', icon: '▲' },
            { to: '/analytics', label: 'Analytics', icon: '▩' },
            { to: '/skill-gap', label: 'Skill Gap', icon: '◈' },
        ]
    },
    {
        section: 'System', items: [
            { to: '/settings', label: 'Settings', icon: '⚙' },
        ]
    },
];

export default function Layout() {
    const location = useLocation();

    return (
        <div className="app-layout">
            <aside className="app-sidebar">
                <div className="sidebar-logo">
                    <h1>ImpactMatch</h1>
                    <span>Volunteer Coordination OS</span>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(section => (
                        <div key={section.section}>
                            <div className="sidebar-section-label">{section.section}</div>
                            {section.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                                    end={item.to === '/'}
                                >
                                    <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <div style={{
                    padding: '0.75rem 1rem',
                    borderTop: '0.5px solid var(--color-border-tertiary)',
                    fontSize: 10,
                    color: 'var(--color-text-tertiary)',
                    letterSpacing: '0.08em',
                }}>
                    v1.0.0 · {new Date().getFullYear()}
                </div>
            </aside>

            <main className="app-main">
                <header className="app-topbar">
                    <div className="topbar-left">
                        <input
                            type="text"
                            className="topbar-search"
                            placeholder="Search volunteers, needs, zones..."
                        />
                    </div>
                    <div className="topbar-right">
                        <span className="topbar-badge">AI Active</span>
                        <div className="topbar-avatar">AD</div>
                    </div>
                </header>

                <div className="app-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
