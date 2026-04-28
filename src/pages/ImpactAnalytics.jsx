import { useState } from 'react';
import { useApp } from '../context/AppContext';
import BarPrisms from '../components/iso/BarPrisms';

export default function ImpactAnalytics() {
    const { needs, volunteers, zones } = useApp();
    const [period, setPeriod] = useState('monthly');

    const totalHours = Math.round(volunteers.reduce((s, v) => s + v.hoursLogged, 0));
    const resolvedPct = Math.round((needs.filter(n => n.status === 'done').length / Math.max(needs.length, 1)) * 100);
    const avgCoverage = Math.round(zones.reduce((s, z) => s + z.coverage, 0) / Math.max(zones.length, 1));

    const monthlyData = [
        { label: 'Oct', value: 42, fill: '#14b8a6' },
        { label: 'Nov', value: 58, fill: '#3b82f6' },
        { label: 'Dec', value: 35, fill: '#14b8a6' },
        { label: 'Jan', value: 71, fill: '#a855f7' },
        { label: 'Feb', value: 63, fill: '#3b82f6' },
        { label: 'Mar', value: 82, fill: '#14b8a6' },
        { label: 'Apr', value: 55, fill: '#a855f7' },
    ];

    const quarterlyData = [
        { label: 'Q1', value: 156, fill: '#14b8a6' },
        { label: 'Q2', value: 198, fill: '#3b82f6' },
        { label: 'Q3', value: 142, fill: '#a855f7' },
        { label: 'Q4', value: 175, fill: '#14b8a6' },
    ];

    const zoneImprovements = zones.map(z => ({
        name: z.name,
        before: Math.max(z.coverage - Math.round(Math.random() * 20), 30),
        after: z.coverage,
    }));

    const handleExportPDF = () => {
        const content = `ImpactMatch Analytics Report\n\nPeriod: ${period}\nTotal Volunteer Hours: ${totalHours}\nNeeds Resolved: ${resolvedPct}%\nAverage Zone Coverage: ${avgCoverage}%\n\nZone Improvements:\n${zoneImprovements.map(z => `  ${z.name}: ${z.before}% → ${z.after}%`).join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `impact-report-${period}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-header-title">Impact Analytics</h1>
                    <p className="page-header-subtitle">Performance and outcomes</p>
                </div>
                <button className="btn btn-secondary" onClick={handleExportPDF}>
                    ↓ Export Report
                </button>
            </div>

            {/* Period toggle */}
            <div className="tabs fade-up" style={{ '--stagger': '0.05s' }}>
                <button className={`tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
                <button className={`tab ${period === 'quarterly' ? 'active' : ''}`} onClick={() => setPeriod('quarterly')}>Quarterly</button>
            </div>

            {/* KPIs */}
            <div className="grid-4 mb-lg">
                {[
                    { label: 'Volunteer Hours', value: totalHours.toLocaleString(), delta: '+12% from last period' },
                    { label: 'Needs Resolved', value: `${resolvedPct}%`, delta: `${needs.filter(n => n.status === 'done').length} of ${needs.length}` },
                    { label: 'Avg Coverage', value: `${avgCoverage}%`, delta: `Across ${zones.length} zones` },
                    { label: 'Active Volunteers', value: volunteers.filter(v => v.status === 'active').length, delta: `of ${volunteers.length} total` },
                ].map((m, i) => (
                    <div key={i} className="metric-card fade-up" style={{ '--stagger': `${(i + 1) * 0.05}s` }}>
                        <div className="metric-card-label">{m.label}</div>
                        <div className="metric-card-value">{m.value}</div>
                        <div className="metric-card-delta up">{m.delta}</div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="raised-card mb-lg fade-up" style={{ '--stagger': '0.2s' }}>
                <div className="section-label mb-sm">
                    {period === 'monthly' ? 'Monthly Needs Resolved' : 'Quarterly Summary'}
                </div>
                <BarPrisms data={period === 'monthly' ? monthlyData : quarterlyData} />
            </div>

            {/* Zone Improvement */}
            <div className="grid-2">
                <div className="raised-card fade-up" style={{ '--stagger': '0.25s' }}>
                    <div className="section-label mb-sm">Zone Improvement Delta</div>
                    {zoneImprovements.map((z, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.5rem 0', borderBottom: '0.5px solid var(--color-gray-100)',
                        }}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{z.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 12 }}>
                                <span className="text-muted">{z.before}%</span>
                                <span style={{ color: 'var(--color-teal-600)' }}>→</span>
                                <span style={{ fontWeight: 500, color: 'var(--color-teal-700)' }}>{z.after}%</span>
                                <span className="badge badge-teal">+{z.after - z.before}%</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="raised-card fade-up" style={{ '--stagger': '0.3s' }}>
                    <div className="section-label mb-sm">Top Volunteers by Hours</div>
                    {[...volunteers].sort((a, b) => b.hoursLogged - a.hoursLogged).slice(0, 8).map((v, i) => (
                        <div key={v.id} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.4rem 0', borderBottom: '0.5px solid var(--color-gray-100)',
                        }}>
                            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', width: 20 }}>
                                {i + 1}.
                            </span>
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: 'var(--color-teal-100)', color: 'var(--color-teal-700)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, fontWeight: 500,
                            }}>
                                {v.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span style={{ flex: 1, fontSize: 12 }}>{v.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{Math.round(v.hoursLogged)}h</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
