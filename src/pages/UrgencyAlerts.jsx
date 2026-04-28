import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function UrgencyAlerts() {
    const { alerts, needs, volunteers, acknowledgeAlert, assignVolunteer, zones } = useApp();
    const [now] = useState(new Date());
    const [escalationConfig, setEscalationConfig] = useState({
        level1: 30,
        level2: 60,
        level3: 120,
    });
    const [showConfig, setShowConfig] = useState(false);

    const formatElapsed = (triggeredAt) => {
        const diff = Math.round((now - new Date(triggeredAt)) / 60000);
        if (diff < 60) return `${diff}m`;
        return `${Math.round(diff / 60)}h ${diff % 60}m`;
    };

    const getEscalationLevel = (triggeredAt) => {
        const diff = (now - new Date(triggeredAt)) / 60000;
        if (diff >= escalationConfig.level3) return 3;
        if (diff >= escalationConfig.level2) return 2;
        if (diff >= escalationConfig.level1) return 1;
        return 0;
    };

    const sortedAlerts = [...alerts].sort((a, b) => {
        if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
        return new Date(b.triggeredAt) - new Date(a.triggeredAt);
    });

    const handleQuickAssign = (alert) => {
        const need = needs.find(n => n.id === alert.needId);
        if (!need) return;
        // Assign first available volunteer in same zone
        const available = volunteers.find(v => v.status === 'active' && v.zone === need.zone && !needs.some(n => n.assignedTo === v.id && n.status === 'active'));
        if (available) {
            assignVolunteer(alert.needId, available.id);
            acknowledgeAlert(alert.id);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Urgency Alerts</h1>
                <p className="page-header-subtitle">Auto-triggered severity monitoring</p>
            </div>

            {/* Summary */}
            <div className="grid-4 mb-lg">
                {[
                    { label: 'Active Alerts', value: alerts.filter(a => !a.acknowledged).length },
                    { label: 'Critical', value: alerts.filter(a => a.type === 'critical' && !a.acknowledged).length },
                    { label: 'Acknowledged', value: alerts.filter(a => a.acknowledged).length },
                    { label: 'Avg Response', value: '42m' },
                ].map((m, i) => (
                    <div key={i} className="metric-card fade-up" style={{ '--stagger': `${i * 0.05}s` }}>
                        <div className="metric-card-label">{m.label}</div>
                        <div className="metric-card-value">{m.value}</div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mb-md">
                <div className="section-label" style={{ marginBottom: 0 }}>Alert Feed</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowConfig(!showConfig)}>
                    ⚙ Escalation Config
                </button>
            </div>

            {/* Escalation Config */}
            {showConfig && (
                <div className="raised-card mb-md fade-up" style={{ '--stagger': '0.05s' }}>
                    <div className="section-label mb-sm">Escalation Chain Thresholds (minutes)</div>
                    <div className="grid-3">
                        {[
                            { key: 'level1', label: 'Level 1 (Notify)' },
                            { key: 'level2', label: 'Level 2 (Escalate)' },
                            { key: 'level3', label: 'Level 3 (Critical)' },
                        ].map(({ key, label }) => (
                            <div key={key} className="form-group">
                                <label className="form-label">{label}</label>
                                <input type="number" className="form-input" value={escalationConfig[key]}
                                    onChange={e => setEscalationConfig(c => ({ ...c, [key]: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Alert List */}
            <div>
                {sortedAlerts.map((alert, i) => {
                    const need = needs.find(n => n.id === alert.needId);
                    const zone = need ? zones.find(z => z.id === need.zone) : null;
                    const level = getEscalationLevel(alert.triggeredAt);

                    return (
                        <div key={alert.id}
                            className="raised-card mb-sm fade-up"
                            style={{
                                '--stagger': `${(i + 2) * 0.04}s`,
                                opacity: alert.acknowledged ? 0.6 : 1,
                                borderLeft: `3px solid ${alert.type === 'critical' ? 'var(--color-coral-500)' : 'var(--color-amber-500)'}`,
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-sm mb-sm">
                                        <span className={`badge ${alert.type === 'critical' ? 'badge-coral' : 'badge-amber'}`}>
                                            {alert.type}
                                        </span>
                                        {level >= 2 && <span className="badge badge-coral">L{level} ESCALATED</span>}
                                        {alert.acknowledged && <span className="badge badge-gray">acknowledged</span>}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{alert.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                                        {alert.message}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                        {zone?.name} · Triggered {formatElapsed(alert.triggeredAt)} ago
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0, marginLeft: '1rem' }}>
                                    {/* Response timer */}
                                    <div style={{
                                        fontSize: 18, fontWeight: 500, textAlign: 'center',
                                        color: level >= 2 ? 'var(--color-coral-600)' : level >= 1 ? 'var(--color-amber-600)' : 'var(--color-text-secondary)',
                                    }}>
                                        {formatElapsed(alert.triggeredAt)}
                                    </div>
                                    {!alert.acknowledged && (
                                        <>
                                            <button className="btn btn-primary btn-sm" onClick={() => handleQuickAssign(alert)}>
                                                Assign Responder
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => acknowledgeAlert(alert.id)}>
                                                Acknowledge
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
