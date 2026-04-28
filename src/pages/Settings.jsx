import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
    const { settings, updateSettings } = useApp();
    const [activeTab, setActiveTab] = useState('org');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'org', label: 'Organization' },
        { id: 'roles', label: 'User Roles' },
        { id: 'zones', label: 'Zone Boundaries' },
        { id: 'api', label: 'API Config' },
        { id: 'notifs', label: 'Notifications' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Settings & Orgs</h1>
                <p className="page-header-subtitle">System configuration</p>
            </div>

            {/* Tabs */}
            <div className="tabs fade-up" style={{ '--stagger': '0.05s' }}>
                {tabs.map(t => (
                    <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Organization */}
            {activeTab === 'org' && (
                <div className="fade-up" style={{ '--stagger': '0.1s' }}>
                    <div className="raised-card mb-lg">
                        <div className="section-label mb-md">Multi-Org Switcher</div>
                        {settings.organizations.map(org => (
                            <div key={org.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.6rem 0', borderBottom: '0.5px solid var(--color-gray-100)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{org.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{org.id}</div>
                                </div>
                                <button className={`btn btn-sm ${org.active ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => {
                                        updateSettings({
                                            organizations: settings.organizations.map(o => ({ ...o, active: o.id === org.id })),
                                            orgName: org.name,
                                            orgId: org.id,
                                        });
                                    }}
                                >
                                    {org.active ? 'Active' : 'Switch'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="raised-card">
                        <div className="section-label mb-md">Organization Details</div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Organization Name</label>
                                <input className="form-input" value={settings.orgName}
                                    onChange={e => updateSettings({ orgName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Timezone</label>
                                <select className="form-select" value={settings.timezone}
                                    onChange={e => updateSettings({ timezone: e.target.value })}>
                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                    <option value="Europe/London">Europe/London (GMT)</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary mt-md" onClick={handleSave}>Save Changes</button>
                        {saved && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-teal-600)' }}>✓ Saved</span>}
                    </div>
                </div>
            )}

            {/* User Roles */}
            {activeTab === 'roles' && (
                <div className="raised-card fade-up" style={{ '--stagger': '0.1s' }}>
                    <div className="section-label mb-md">Role Management</div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {settings.roles.map(user => (
                                <tr key={user.userId}>
                                    <td style={{ fontWeight: 500 }}>{user.name}</td>
                                    <td style={{ fontSize: 11 }}>{user.email}</td>
                                    <td>
                                        <select className="form-select" style={{ width: 'auto', padding: '2px 8px', fontSize: 11 }}
                                            value={user.role}
                                            onChange={e => updateSettings({
                                                roles: settings.roles.map(r => r.userId === user.userId ? { ...r, role: e.target.value } : r)
                                            })}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="coordinator">Coordinator</option>
                                            <option value="field">Field Agent</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="btn btn-secondary mt-md">+ Add User</button>
                </div>
            )}

            {/* Zone Boundaries */}
            {activeTab === 'zones' && (
                <div className="raised-card fade-up" style={{ '--stagger': '0.1s' }}>
                    <div className="section-label mb-md">Zone Boundary Editor</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Define GPS coordinates for each zone boundary. Changes affect zone assignment and coverage calculations.
                    </div>
                    {['North District', 'East Sector', 'South Ward', 'West Block'].map((zone, i) => (
                        <div key={i} style={{
                            padding: '0.75rem', background: 'var(--color-gray-50)', marginBottom: 8,
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{zone}</div>
                            <div className="grid-2" style={{ gap: '0.5rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">NW Corner (lat, lng)</label>
                                    <input className="form-input" placeholder="19.090, 72.860" style={{ fontSize: 11 }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">SE Corner (lat, lng)</label>
                                    <input className="form-input" placeholder="19.070, 72.890" style={{ fontSize: 11 }} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-primary mt-md" onClick={handleSave}>Save Boundaries</button>
                    {saved && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-teal-600)' }}>✓ Saved</span>}
                </div>
            )}

            {/* API Config */}
            {activeTab === 'api' && (
                <div className="raised-card fade-up" style={{ '--stagger': '0.1s' }}>
                    <div className="section-label mb-md">Anthropic API Configuration</div>
                    <div className="form-group">
                        <label className="form-label">API Key</label>
                        <input className="form-input" type="password" value={settings.apiKey}
                            onChange={e => updateSettings({ apiKey: e.target.value })}
                            placeholder="sk-ant-..." />
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                            Used for: Match Engine, AI Brief, Need Extraction, Skill Gap Analysis, Auto-categorization
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Model</label>
                        <input className="form-input" value="claude-sonnet-4-20250514" disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Tokens</label>
                        <input className="form-input" value="1000" disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alert Severity Threshold</label>
                        <input className="form-input" type="number" min="1" max="10" value={settings.alertThreshold}
                            onChange={e => updateSettings({ alertThreshold: parseInt(e.target.value) || 7 })} />
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                            Alerts auto-trigger when need severity meets or exceeds this threshold
                        </div>
                    </div>
                    <button className="btn btn-primary mt-md" onClick={handleSave}>Save Config</button>
                    {saved && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-teal-600)' }}>✓ Saved</span>}
                </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifs' && (
                <div className="raised-card fade-up" style={{ '--stagger': '0.1s' }}>
                    <div className="section-label mb-md">Notification Preferences</div>
                    {[
                        { key: 'email', label: 'Email Notifications', desc: 'Receive alerts and summaries via email' },
                        { key: 'sms', label: 'SMS Notifications', desc: 'Get critical alerts via SMS' },
                        { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications for urgent alerts' },
                    ].map(({ key, label, desc }) => (
                        <div key={key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 0', borderBottom: '0.5px solid var(--color-gray-100)',
                        }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{desc}</div>
                            </div>
                            <label style={{
                                position: 'relative', display: 'inline-block', width: 36, height: 20, cursor: 'pointer',
                            }}>
                                <input type="checkbox" checked={settings.notificationPrefs[key]}
                                    onChange={e => updateSettings({
                                        notificationPrefs: { ...settings.notificationPrefs, [key]: e.target.checked }
                                    })}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', inset: 0,
                                    background: settings.notificationPrefs[key] ? 'var(--color-teal-500)' : 'var(--color-gray-300)',
                                    borderRadius: 10, transition: 'background 0.2s',
                                }}>
                                    <span style={{
                                        position: 'absolute', left: settings.notificationPrefs[key] ? 18 : 2, top: 2,
                                        width: 16, height: 16, borderRadius: '50%', background: 'white',
                                        transition: 'left 0.2s',
                                    }} />
                                </span>
                            </label>
                        </div>
                    ))}
                    <button className="btn btn-primary mt-md" onClick={handleSave}>Save Preferences</button>
                    {saved && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-teal-600)' }}>✓ Saved</span>}
                </div>
            )}
        </div>
    );
}
