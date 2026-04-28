import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getDailyBrief } from '../services/claude';
import DashboardCubes from '../components/iso/DashboardCubes';
import { useNavigate } from 'react-router-dom';

function AnimatedCounter({ target, duration = 800 }) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        let start = 0;
        const end = typeof target === 'number' ? target : parseInt(target) || 0;
        if (end === 0) { setValue(target); return; }
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }, [target, duration]);

    return <span>{value}</span>;
}

export default function Dashboard() {
    const { needs, volunteers, zones, settings } = useApp();
    const navigate = useNavigate();
    const [brief, setBrief] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredZone, setHoveredZone] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
    const [selectedHeatCell, setSelectedHeatCell] = useState(null);
    const [liveTimestamp, setLiveTimestamp] = useState(new Date());
    const heatmapRef = useRef(null);

    const openNeeds = needs.filter(n => n.status === 'open').length;
    const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
    const matchesToday = needs.filter(n => n.status === 'active').length;
    const zonesCovered = zones.filter(z => z.coverage > 50).length;

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setLiveTimestamp(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        async function fetchBrief() {
            setLoading(true);
            const data = await getDailyBrief(needs, volunteers, settings.apiKey);
            setBrief(data);
            setLoading(false);
        }
        fetchBrief();
    }, []);

    const criticalNeeds = needs
        .filter(n => n.status === 'open' && n.severity >= 8)
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 3);

    const heatCells = zones.map(z => {
        const zoneNeeds = needs.filter(n => n.zone === z.id);
        const openNeeds = zoneNeeds.filter(n => n.status === 'open');
        const maxSeverity = zoneNeeds.length ? Math.max(...zoneNeeds.map(n => n.severity)) : 0;
        const avgSeverity = zoneNeeds.length
            ? +(zoneNeeds.reduce((s, n) => s + n.severity, 0) / zoneNeeds.length).toFixed(1)
            : 0;
        const urgencyScore = Math.min(10, Math.round(maxSeverity * 0.6 + openNeeds.length * 0.8 + (100 - z.coverage) * 0.04));
        return { ...z, maxSeverity, avgSeverity, urgencyScore, needCount: zoneNeeds.length, openCount: openNeeds.length };
    });

    const severityColor = (sev) => {
        if (sev >= 8) return 'var(--color-coral-400)';
        if (sev >= 6) return 'var(--color-amber-400)';
        if (sev >= 4) return 'var(--color-teal-400)';
        return 'var(--color-gray-200)';
    };

    const handleHeatCellHover = (e, cell) => {
        const rect = heatmapRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltip({
                visible: true,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 40,
                content: `${cell.name}: ${cell.needCount} needs (${cell.openCount} open) · Avg severity: ${cell.avgSeverity}/10 · Coverage: ${cell.coverage}%`,
            });
        }
    };

    const handleHeatCellClick = (cell) => {
        setSelectedHeatCell(selectedHeatCell === cell.id ? null : cell.id);
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-header-title">Command Dashboard</h1>
                    <p className="page-header-subtitle">Real-time operations overview</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    <span className="live-dot"></span>
                    LIVE · {liveTimestamp.toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards with animated counters */}
            <div className="grid-4 mb-lg">
                {[
                    { label: 'Needs Open', value: openNeeds, delta: '+3 today', up: false, color: 'var(--color-coral-600)', onClick: () => navigate('/needs') },
                    { label: 'Volunteers Active', value: activeVolunteers, delta: `of ${volunteers.length} total`, up: true, color: 'var(--color-teal-600)', onClick: () => navigate('/volunteers') },
                    { label: 'Matches Today', value: matchesToday, delta: '+2 from yesterday', up: true, color: 'var(--color-blue-600)', onClick: () => navigate('/match') },
                    { label: 'Zones Covered', value: zonesCovered, isZone: true, delta: `${Math.round(zones.reduce((s, z) => s + z.coverage, 0) / zones.length)}% avg`, up: true, color: 'var(--color-teal-600)', onClick: () => navigate('/zones') },
                ].map((m, i) => (
                    <div key={i} className="metric-card fade-up" style={{ '--stagger': `${i * 0.05}s`, cursor: 'pointer' }} onClick={m.onClick}>
                        <div className="metric-card-label">{m.label}</div>
                        <div className="metric-card-value count-up" style={{ '--stagger': `${i * 0.1}s` }}>
                            {m.isZone ? `${zonesCovered}/${zones.length}` : <AnimatedCounter target={m.value} />}
                        </div>
                        <div className={`metric-card-delta ${m.up ? 'up' : 'down'}`}>{m.delta}</div>
                        {/* Mini progress indicator */}
                        <div style={{ marginTop: 8, height: 2, background: 'var(--color-gray-200)', borderRadius: 1 }}>
                            <div style={{
                                height: '100%', borderRadius: 1,
                                background: m.color,
                                width: `${Math.min((m.value / (m.isZone ? zones.length : Math.max(volunteers.length, needs.length))) * 100, 100)}%`,
                                transition: 'width 0.8s ease',
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-sidebar">
                <div>
                    {/* Interactive Urgency Heatmap */}
                    <div className="raised-card mb-md fade-up" style={{ '--stagger': '0.2s', position: 'relative' }} ref={heatmapRef}>
                        <div className="flex justify-between items-center mb-sm">
                            <div className="section-label" style={{ marginBottom: 0 }}>
                                <span className="live-dot"></span>
                                Urgency Heatmap
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                Click zones to drill down
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '0.5rem' }}>
                            <DashboardCubes />
                            <div style={{ flex: 1 }}>
                                {/* Zone urgency cards — each is visually distinct */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    {heatCells.map((cell, i) => {
                                        const isSelected = selectedHeatCell === cell.id;
                                        return (
                                            <div key={cell.id}
                                                onMouseMove={(e) => handleHeatCellHover(e, cell)}
                                                onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                                                onClick={() => handleHeatCellClick(cell)}
                                                className="fade-up"
                                                style={{
                                                    '--stagger': `${i * 0.06}s`,
                                                    padding: '8px 10px',
                                                    background: isSelected ? 'var(--color-gray-100)' : 'var(--color-gray-50)',
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: 'pointer',
                                                    border: isSelected ? '1.5px solid var(--color-gray-900)' : '0.5px solid var(--color-border-tertiary)',
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                }}
                                            >
                                                {/* Zone name + urgency badge */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                                        {cell.name}
                                                    </span>
                                                    <span className={`badge ${cell.urgency === 'critical' ? 'badge-coral pulse-critical' : cell.urgency === 'high' ? 'badge-amber' : 'badge-teal'}`}
                                                        style={{ fontSize: 8, padding: '1px 5px' }}>
                                                        {cell.urgency}
                                                    </span>
                                                </div>

                                                {/* Urgency score — weighted metric, unique per zone */}
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                                                    <span style={{
                                                        fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-mono)', lineHeight: 1,
                                                        color: cell.urgencyScore >= 8 ? 'var(--color-coral-600)' : cell.urgencyScore >= 6 ? 'var(--color-amber-600)' : 'var(--color-teal-600)',
                                                    }}>
                                                        {cell.urgencyScore}
                                                    </span>
                                                    <span style={{ fontSize: 8, color: 'var(--color-text-tertiary)' }}>/10</span>
                                                </div>

                                                {/* Animated urgency bar */}
                                                <div style={{ height: 4, background: 'var(--color-gray-200)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                                                    <div className="bar-animated" style={{
                                                        '--stagger': `${i * 0.1 + 0.2}s`,
                                                        height: '100%', borderRadius: 2,
                                                        width: `${cell.urgencyScore * 10}%`,
                                                        background: cell.urgencyScore >= 8 ? 'var(--color-coral-400)' : cell.urgencyScore >= 6 ? 'var(--color-amber-400)' : 'var(--color-teal-400)',
                                                    }} />
                                                </div>

                                                {/* Stats row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                                                    <span>max <strong style={{ color: 'var(--color-text-secondary)' }}>{cell.maxSeverity}</strong></span>
                                                    <span>avg <strong style={{ color: 'var(--color-text-secondary)' }}>{cell.avgSeverity}</strong></span>
                                                    <span style={{ color: cell.openCount > 0 ? 'var(--color-coral-600)' : 'var(--color-teal-600)' }}>
                                                        {cell.openCount} open
                                                    </span>
                                                </div>

                                                {/* Coverage mini bar */}
                                                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <div style={{ flex: 1, height: 2, background: 'var(--color-gray-200)', borderRadius: 1 }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: 1,
                                                            width: `${cell.coverage}%`,
                                                            background: cell.coverage >= 70 ? 'var(--color-teal-400)' : 'var(--color-amber-400)',
                                                            transition: 'width 0.6s ease',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: 8, color: 'var(--color-text-tertiary)' }}>{cell.coverage}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Drilldown panel when zone selected */}
                                {selectedHeatCell && (() => {
                                    const cell = heatCells.find(c => c.id === selectedHeatCell);
                                    const zoneNeeds = needs.filter(n => n.zone === selectedHeatCell);
                                    if (!cell) return null;
                                    return (
                                        <div className="fade-up" style={{
                                            marginTop: 8, padding: '0.5rem', background: 'var(--color-gray-50)',
                                            borderRadius: 'var(--radius-md)', fontSize: 11,
                                        }}>
                                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{cell.name} — {zoneNeeds.length} needs</div>
                                            {zoneNeeds.slice(0, 3).map(n => (
                                                <div key={n.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', padding: '2px 0',
                                                    color: 'var(--color-text-secondary)',
                                                }}>
                                                    <span className="truncate" style={{ flex: 1 }}>{n.title}</span>
                                                    <span className={`badge ${n.severity >= 8 ? 'badge-coral' : 'badge-amber'}`}
                                                        style={{ marginLeft: 8 }}>{n.severity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Floating tooltip */}
                        {tooltip.visible && (
                            <div className="viz-tooltip visible" style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}>
                                {tooltip.content}
                            </div>
                        )}
                    </div>

                    {/* Critical Needs with response timers */}
                    <div className="raised-card fade-up" style={{ '--stagger': '0.3s' }}>
                        <div className="section-label">Top Unmatched Critical Needs</div>
                        <div style={{ marginTop: '0.5rem' }}>
                            {criticalNeeds.map((need, i) => {
                                const elapsed = Math.round((Date.now() - new Date(need.reportedAt).getTime()) / 3600000);
                                return (
                                    <div key={need.id}
                                        onClick={() => navigate('/match')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.6rem 0', cursor: 'pointer',
                                            borderBottom: i < criticalNeeds.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 'var(--radius-md)',
                                            background: 'var(--color-coral-50)', color: 'var(--color-coral-700)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 500, flexShrink: 0, position: 'relative',
                                        }}>
                                            {need.severity}
                                            {need.severity >= 9 && (
                                                <div className="pulse-ring" style={{ width: 28, height: 28, top: 0, left: 0 }} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }} className="truncate">
                                                {need.title}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                                                {need.category} · {zones.find(z => z.id === need.zone)?.name || need.zone}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <span className="badge badge-coral">{need.status}</span>
                                            <div style={{
                                                fontSize: 10, marginTop: 2,
                                                color: elapsed > 4 ? 'var(--color-coral-600)' : 'var(--color-text-tertiary)',
                                                fontWeight: elapsed > 4 ? 500 : 400,
                                            }}>
                                                {elapsed}h ago
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {criticalNeeds.length === 0 && (
                                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', padding: '1rem 0' }}>
                                    No unmatched critical needs ✓
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Daily Brief */}
                <div className="raised-card fade-up" style={{ '--stagger': '0.25s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span className="badge badge-purple">AI Brief</span>
                        <span className="section-label" style={{ marginBottom: 0 }}>Daily Intelligence</span>
                    </div>
                    {loading ? (
                        <div>
                            <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '85%' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '70%', marginTop: 16 }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '95%' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '75%' }}></div>
                        </div>
                    ) : brief ? (
                        <div>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                                {brief.summary}
                            </p>
                            {brief.priorities?.length > 0 && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div className="section-label">Priority Actions</div>
                                    {brief.priorities.map((p, i) => (
                                        <div key={i} style={{
                                            fontSize: 11, color: 'var(--color-text-secondary)', padding: '0.3rem 0',
                                            display: 'flex', gap: '0.5rem',
                                        }}>
                                            <span style={{ color: 'var(--color-teal-500)', fontWeight: 500 }}>{i + 1}.</span>
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {brief.riskFlags?.length > 0 && (
                                <div>
                                    <div className="section-label">Risk Flags</div>
                                    {brief.riskFlags.map((r, i) => (
                                        <div key={i} style={{
                                            fontSize: 11, color: 'var(--color-coral-700)', padding: '0.3rem 0',
                                            display: 'flex', gap: '0.5rem',
                                        }}>
                                            <span className="pulse-critical">▲</span>
                                            {r}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
