import { useState, useEffect } from 'react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});

    const toggleSection = (sectionName) => {
        setCollapsedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
    };

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    return (
        <div className="app-layout">
            {isMobileMenuOpen && (
                <div 
                    className="mobile-menu-overlay" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            <aside className={`app-sidebar ${isMobileMenuOpen ? 'open' : ''} ${isSidebarCollapsed ? 'desktop-collapsed' : ''}`}>
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button 
                        className="desktop-toggle-btn" 
                        onClick={() => setIsSidebarCollapsed(true)}
                        aria-label="Hide Sidebar"
                        style={{ opacity: 0.7 }}
                    >
                        ☰
                    </button>
                    <div>
                        <h1 style={{ margin: 0, lineHeight: 1.2 }}>ImpactMatch</h1>
                        <span>Volunteer Coordination OS</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(section => (
                        <div key={section.section}>
                            <div 
                                className="sidebar-section-label" 
                                onClick={() => toggleSection(section.section)}
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                                title="Click to toggle section"
                            >
                                <span>{section.section}</span>
                                <span style={{ fontSize: '8px', opacity: 0.6, transform: collapsedSections[section.section] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}>
                                    ▼
                                </span>
                            </div>
                            {!collapsedSections[section.section] && section.items.map(item => (
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

            <main className={`app-main ${isSidebarCollapsed ? 'desktop-expanded' : ''}`}>
                <header className="app-topbar">
                    <div className="topbar-left">
                        <button 
                            className="mobile-menu-btn" 
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            ☰
                        </button>
                        {isSidebarCollapsed && (
                            <button 
                                className="desktop-toggle-btn" 
                                onClick={() => setIsSidebarCollapsed(false)}
                                aria-label="Show Sidebar"
                                title="Show Sidebar"
                            >
                                ☰
                            </button>
                        )}
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
