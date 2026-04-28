import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = HOURS.map(h => `${h.toString().padStart(2, '0')}:00`);
const CATEGORIES = ['Medical', 'Food & Nutrition', 'Infrastructure', 'Water & Sanitation', 'Counseling', 'Child Care', 'IT Support', 'Logistics', 'Education', 'Translation'];

function severityToColor(val, max) {
    const ratio = val / (max || 1);
    if (ratio >= 0.8) return { bg: 'var(--color-coral-400)', text: 'white' };
    if (ratio >= 0.6) return { bg: 'var(--color-coral-300)', text: 'var(--color-gray-900)' };
    if (ratio >= 0.4) return { bg: 'var(--color-amber-300)', text: 'var(--color-gray-900)' };
    if (ratio >= 0.2) return { bg: 'var(--color-amber-200)', text: 'var(--color-gray-800)' };
    if (ratio > 0) return { bg: 'var(--color-teal-200)', text: 'var(--color-gray-800)' };
    return { bg: 'var(--color-gray-50)', text: 'var(--color-gray-400)' };
}

export default function UrgencyHeatmap() {
    const { needs, zones, volunteers, alerts } = useApp();
    const navigate = useNavigate();
    const [view, setView] = useState('zone-time');
    const [hoveredCell, setHoveredCell] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [liveTimestamp, setLiveTimestamp] = useState(new Date());
    const [animatedCells, setAnimatedCells] = useState(new Set());
    const containerRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setLiveTimestamp(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Staggered cell reveal animation
    useEffect(() => {
        const total = view === 'zone-time' ? zones.length * 24 : zones.length * CATEGORIES.length;
        let i = 0;
        const timer = setInterval(() => {
            setAnimatedCells(prev => new Set([...prev, i]));
            i++;
            if (i >= total) clearInterval(timer);
        }, 8);
        return () => clearInterval(timer);
    }, [view]);

    // Simulate periodic "live" severity spikes
    const [spikeCells, setSpikeCells] = useState(new Set());
    useEffect(() => {
        const timer = setInterval(() => {
            const idx = Math.floor(Math.random() * 20);
            setSpikeCells(prev => {
                const next = new Set(prev);
                if (next.has(idx)) next.delete(idx);
                else next.add(idx);
                return next;
            });
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // Build Zone × Time heatmap data
    const zoneTimeData = zones.map(z => {
        const zoneNeeds = needs.filter(n => n.zone === z.id);
        const hourBuckets = HOURS.map(h => {
            const matching = zoneNeeds.filter(n => {
                const d = new Date(n.reportedAt);
                return d.getHours() === h;
            });
            return {
                count: matching.length,
                avgSeverity: matching.length ? Math.round(matching.reduce((s, n) => s + n.severity, 0) / matching.length) : 0,
                maxSeverity: matching.length ? Math.max(...matching.map(n => n.severity)) : 0,
                needs: matching,
            };
        });
        return { zone: z, hours: hourBuckets };
    });

    // Build Zone × Category heatmap data
    const zoneCatData = zones.map(z => {
        const zoneNeeds = needs.filter(n => n.zone === z.id);
        const catBuckets = CATEGORIES.map(cat => {
            const matching = zoneNeeds.filter(n => n.category === cat);
            return {
                count: matching.length,
                avgSeverity: matching.length ? Math.round(matching.reduce((s, n) => s + n.severity, 0) / matching.length) : 0,
                maxSeverity: matching.length ? Math.max(...matching.map(n => n.severity)) : 0,
                needs: matching,
            };
        });
        return { zone: z, categories: catBuckets };
    });

    // Summary stats
    const totalOpen = needs.filter(n => n.status === 'open').length;
    const criticalCount = needs.filter(n => n.severity >= 8).length;
    const activeAlerts = alerts.filter(a => !a.acknowledged).length;
    const maxSeverity = Math.max(...needs.map(n => n.severity));

    const handleCellHover = useCallback((e, cellData, rowLabel, colLabel) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({
            visible: true,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top - 10,
            content: {
                row: rowLabel,
                col: colLabel,
                count: cellData.count,
                avgSeverity: cellData.avgSeverity,
                maxSeverity: cellData.maxSeverity,
                needs: cellData.needs,
            },
        });
        setHoveredCell(`${rowLabel}-${colLabel}`);
    }, []);

    const handleCellLeave = useCallback(() => {
        setTooltip(t => ({ ...t, visible: false }));
        setHoveredCell(null);
    }, []);

    const handleCellClick = (cellData, rowLabel, colLabel) => {
        const key = `${rowLabel}-${colLabel}`;
        setSelectedCell(selectedCell === key ? null : key);
    };

    const selectedCellData = (() => {
        if (!selectedCell) return null;
        const [row, col] = selectedCell.split('-');
        if (view === 'zone-time') {
            const zoneRow = zoneTimeData.find(d => d.zone.name === row);
            if (!zoneRow) return null;
            const hour = parseInt(col);
            return { ...zoneRow.hours[hour], zone: row, label: col };
        } else {
            const zoneRow = zoneCatData.find(d => d.zone.name === row);
            if (!zoneRow) return null;
            const catIdx = CATEGORIES.indexOf(col);
            return { ...zoneRow.categories[catIdx], zone: row, label: col };
        }
    })();

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-header-title">Urgency Heatmap</h1>
                    <p className="page-header-subtitle">
                        <span className="live-dot"></span>
                        Real-time severity distribution
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        {liveTimestamp.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* KPI strip */}
            <div className="grid-4 mb-lg">
                {[
                    { label: 'Peak Severity', value: maxSeverity + '/10', color: 'var(--color-coral-600)', icon: '▲' },
                    { label: 'Critical Needs', value: criticalCount, color: 'var(--color-coral-500)', icon: '◆' },
                    { label: 'Open Needs', value: totalOpen, color: 'var(--color-amber-600)', icon: '◇' },
                    { label: 'Active Alerts', value: activeAlerts, color: 'var(--color-coral-500)', icon: '▲' },
                ].map((m, i) => (
                    <div key={i} className="metric-card fade-up" style={{ '--stagger': `${i * 0.05}s` }}>
                        <div className="metric-card-label">{m.icon} {m.label}</div>
                        <div className="metric-card-value" style={{ color: m.color }}>{m.value}</div>
                    </div>
                ))}
            </div>

            {/* View toggle */}
            <div className="flex justify-between items-center mb-md">
                <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
                    <button className={`tab ${view === 'zone-time' ? 'active' : ''}`} onClick={() => { setView('zone-time'); setSelectedCell(null); setAnimatedCells(new Set()); }}>
                        Zone × Time
                    </button>
                    <button className={`tab ${view === 'zone-cat' ? 'active' : ''}`} onClick={() => { setView('zone-cat'); setSelectedCell(null); setAnimatedCells(new Set()); }}>
                        Zone × Category
                    </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                    Click any cell to inspect
                </div>
            </div>

            <div className="grid-sidebar">
                <div>
                    {/* === Zone × Time Heatmap === */}
                    {view === 'zone-time' && (
                        <div className="raised-card fade-up" style={{ '--stagger': '0.1s', overflowX: 'auto' }}>
                            <div className="section-label mb-sm">Severity by Zone & Hour of Day</div>
                            <div style={{ minWidth: 700 }}>
                                {/* Header row */}
                                <div style={{ display: 'flex', marginBottom: 2 }}>
                                    <div style={{ width: 100, flexShrink: 0 }} />
                                    {HOURS.filter((_, i) => i % 3 === 0).map(h => (
                                        <div key={h} style={{
                                            flex: 3, fontSize: 8, color: 'var(--color-text-tertiary)',
                                            textAlign: 'center', fontFamily: 'var(--font-mono)',
                                        }}>
                                            {HOUR_LABELS[h]}
                                        </div>
                                    ))}
                                </div>
                                {/* Data rows */}
                                {zoneTimeData.map((row, ri) => (
                                    <div key={row.zone.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                                        <div style={{
                                            width: 100, flexShrink: 0, fontSize: 11, fontWeight: 500,
                                            paddingRight: 8, textAlign: 'right',
                                            color: row.zone.urgency === 'critical' ? 'var(--color-coral-700)' : 'var(--color-text-secondary)',
                                        }}>
                                            {row.zone.name}
                                        </div>
                                        {row.hours.map((cell, ci) => {
                                            const cellIdx = ri * 24 + ci;
                                            const isSpiking = spikeCells.has(cellIdx % 20);
                                            const val = isSpiking ? Math.min(cell.avgSeverity + 3, 10) : cell.avgSeverity;
                                            const colors = severityToColor(val, 10);
                                            const key = `${row.zone.name}-${HOUR_LABELS[ci]}`;
                                            const isHov = hoveredCell === key;
                                            const isSel = selectedCell === key;

                                            return (
                                                <div key={ci}
                                                    onMouseMove={(e) => handleCellHover(e, { ...cell, avgSeverity: val }, row.zone.name, HOUR_LABELS[ci])}
                                                    onMouseLeave={handleCellLeave}
                                                    onClick={() => handleCellClick({ ...cell, avgSeverity: val }, row.zone.name, HOUR_LABELS[ci])}
                                                    style={{
                                                        flex: 1, height: 28, margin: '0 0.5px',
                                                        background: animatedCells.has(cellIdx) ? colors.bg : 'var(--color-gray-50)',
                                                        borderRadius: 3,
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 500,
                                                        color: val > 0 ? colors.text : 'transparent',
                                                        transition: 'background 0.3s, transform 0.15s, box-shadow 0.15s',
                                                        transform: isHov ? 'scale(1.2)' : isSel ? 'scale(1.1)' : 'scale(1)',
                                                        boxShadow: isSel ? '0 0 0 2px var(--color-gray-900)' : isHov ? '0 0 0 1px var(--color-gray-400)' : 'none',
                                                        zIndex: isHov || isSel ? 5 : 1,
                                                        position: 'relative',
                                                        animation: isSpiking ? 'pulse 1s ease-in-out infinite' : 'none',
                                                    }}
                                                >
                                                    {val > 0 ? val : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}

                                {/* Legend */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 12, paddingLeft: 100 }}>
                                    <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>Low</span>
                                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((ratio, i) => (
                                        <div key={i} style={{
                                            width: 18, height: 12, borderRadius: 2,
                                            background: severityToColor(ratio * 10, 10).bg,
                                        }} />
                                    ))}
                                    <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>Critical</span>
                                    <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
                                        ● Pulsing = live spike
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === Zone × Category Heatmap === */}
                    {view === 'zone-cat' && (
                        <div className="raised-card fade-up" style={{ '--stagger': '0.1s', overflowX: 'auto' }}>
                            <div className="section-label mb-sm">Severity by Zone & Category</div>
                            <div style={{ minWidth: 600 }}>
                                {/* Header */}
                                <div style={{ display: 'flex', marginBottom: 4 }}>
                                    <div style={{ width: 100, flexShrink: 0 }} />
                                    {CATEGORIES.map((cat, i) => (
                                        <div key={cat} style={{
                                            flex: 1, fontSize: 7, color: 'var(--color-text-tertiary)',
                                            textAlign: 'center', fontFamily: 'var(--font-mono)',
                                            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                                            height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {cat}
                                        </div>
                                    ))}
                                </div>
                                {/* Rows */}
                                {zoneCatData.map((row, ri) => (
                                    <div key={row.zone.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                                        <div style={{
                                            width: 100, flexShrink: 0, fontSize: 11, fontWeight: 500,
                                            paddingRight: 8, textAlign: 'right',
                                            color: row.zone.urgency === 'critical' ? 'var(--color-coral-700)' : 'var(--color-text-secondary)',
                                        }}>
                                            {row.zone.name}
                                        </div>
                                        {row.categories.map((cell, ci) => {
                                            const cellIdx = ri * CATEGORIES.length + ci;
                                            const colors = severityToColor(cell.avgSeverity, 10);
                                            const key = `${row.zone.name}-${CATEGORIES[ci]}`;
                                            const isHov = hoveredCell === key;
                                            const isSel = selectedCell === key;

                                            return (
                                                <div key={ci}
                                                    onMouseMove={(e) => handleCellHover(e, cell, row.zone.name, CATEGORIES[ci])}
                                                    onMouseLeave={handleCellLeave}
                                                    onClick={() => handleCellClick(cell, row.zone.name, CATEGORIES[ci])}
                                                    style={{
                                                        flex: 1, height: 36, margin: '0 1px',
                                                        background: animatedCells.has(cellIdx) ? colors.bg : 'var(--color-gray-50)',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexDirection: 'column',
                                                        transition: 'background 0.3s, transform 0.15s, box-shadow 0.15s',
                                                        transform: isHov ? 'scale(1.15)' : isSel ? 'scale(1.08)' : 'scale(1)',
                                                        boxShadow: isSel ? '0 0 0 2px var(--color-gray-900)' : isHov ? '0 0 0 1px var(--color-gray-400)' : 'none',
                                                        zIndex: isHov || isSel ? 5 : 1,
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {cell.count > 0 && (
                                                        <>
                                                            <span style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)', color: colors.text }}>{cell.count}</span>
                                                            <span style={{ fontSize: 7, fontFamily: 'var(--font-mono)', color: colors.text, opacity: 0.7 }}>s:{cell.avgSeverity}</span>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}

                                {/* Legend */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 12, paddingLeft: 100 }}>
                                    <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>Low</span>
                                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((ratio, i) => (
                                        <div key={i} style={{
                                            width: 18, height: 12, borderRadius: 2,
                                            background: severityToColor(ratio * 10, 10).bg,
                                        }} />
                                    ))}
                                    <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>Critical</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Zone severity sparklines */}
                    <div className="raised-card mt-md fade-up" style={{ '--stagger': '0.2s' }}>
                        <div className="section-label mb-sm">Zone Severity Timeline</div>
                        {zones.map((z, zi) => {
                            const zoneNeeds = needs.filter(n => n.zone === z.id);
                            const points = Array.from({ length: 12 }, (_, i) => {
                                const h = (liveTimestamp.getHours() - 11 + i + 24) % 24;
                                const matching = zoneNeeds.filter(n => new Date(n.reportedAt).getHours() === h);
                                return matching.length ? Math.round(matching.reduce((s, n) => s + n.severity, 0) / matching.length) : Math.floor(Math.random() * 4) + 2;
                            });
                            const max = Math.max(...points, 1);
                            const w = 400, h = 40;
                            const coords = points.map((p, i) => ({ x: (i / 11) * w, y: h - (p / max) * h }));
                            const polyline = coords.map(c => `${c.x},${c.y}`).join(' ');

                            return (
                                <div key={z.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.5rem 0', borderBottom: zi < zones.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                    onClick={() => { setView('zone-time'); setSelectedCell(null); }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: 90, fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{z.name}</div>
                                    <svg viewBox={`0 0 ${w} ${h}`} style={{ flex: 1, height: 36 }}>
                                        <defs>
                                            <linearGradient id={`grad-${z.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={z.urgency === 'critical' ? 'var(--color-coral-300)' : z.urgency === 'high' ? 'var(--color-amber-300)' : 'var(--color-teal-300)'} stopOpacity="0.4" />
                                                <stop offset="100%" stopColor={z.urgency === 'critical' ? 'var(--color-coral-300)' : z.urgency === 'high' ? 'var(--color-amber-300)' : 'var(--color-teal-300)'} stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <polygon
                                            points={`0,${h} ${polyline} ${w},${h}`}
                                            fill={`url(#grad-${z.id})`}
                                        />
                                        <polyline points={polyline} fill="none"
                                            stroke={z.urgency === 'critical' ? 'var(--color-coral-400)' : z.urgency === 'high' ? 'var(--color-amber-400)' : 'var(--color-teal-400)'}
                                            strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                                        />
                                        {/* Current point */}
                                        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3"
                                            fill={z.urgency === 'critical' ? 'var(--color-coral-500)' : z.urgency === 'high' ? 'var(--color-amber-500)' : 'var(--color-teal-500)'}
                                            className="pulse-critical"
                                        />
                                    </svg>
                                    <div style={{ width: 50, textAlign: 'right', flexShrink: 0 }}>
                                        <span className={`badge ${z.urgency === 'critical' ? 'badge-coral' : z.urgency === 'high' ? 'badge-amber' : 'badge-teal'}`}>
                                            {z.urgency}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detail panel */}
                <div>
                    {selectedCellData && selectedCellData.needs.length > 0 ? (
                        <div className="raised-card fade-up" style={{ '--stagger': '0.15s', position: 'sticky', top: 80 }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: 15, fontWeight: 500 }}>
                                    {selectedCellData.zone}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                    {selectedCellData.label} · {selectedCellData.needs.length} need{selectedCellData.needs.length > 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid-2 mb-md">
                                <div style={{ background: 'var(--color-gray-50)', padding: '0.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Avg Severity</div>
                                    <div style={{ fontSize: 20, fontWeight: 500, color: selectedCellData.avgSeverity >= 7 ? 'var(--color-coral-600)' : 'var(--color-amber-600)' }}>
                                        {selectedCellData.avgSeverity}
                                    </div>
                                </div>
                                <div style={{ background: 'var(--color-gray-50)', padding: '0.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Max Severity</div>
                                    <div style={{ fontSize: 20, fontWeight: 500, color: selectedCellData.maxSeverity >= 8 ? 'var(--color-coral-600)' : 'var(--color-amber-600)' }}>
                                        {selectedCellData.maxSeverity}
                                    </div>
                                </div>
                            </div>

                            {/* Need list */}
                            <div className="section-label">Needs in Cell</div>
                            {selectedCellData.needs.map((need, i) => {
                                const vol = need.assignedTo ? volunteers.find(v => v.id === need.assignedTo) : null;
                                return (
                                    <div key={need.id}
                                        onClick={() => navigate('/needs')}
                                        className="fade-up"
                                        style={{
                                            '--stagger': `${i * 0.05}s`,
                                            padding: '0.6rem 0',
                                            borderBottom: i < selectedCellData.needs.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none',
                                            cursor: 'pointer', transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div className="flex justify-between items-center mb-sm">
                                            <span style={{ fontSize: 12, fontWeight: 500 }} className="truncate" title={need.title}>
                                                {need.title}
                                            </span>
                                            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                                                <span className={`badge ${need.severity >= 8 ? 'badge-coral' : need.severity >= 5 ? 'badge-amber' : 'badge-teal'}`}>
                                                    {need.severity}
                                                </span>
                                                <span className={`badge ${need.status === 'open' ? 'badge-coral' : need.status === 'active' ? 'badge-teal' : 'badge-gray'}`}>
                                                    {need.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                            {need.category} · {vol ? `Assigned: ${vol.name}` : 'Unassigned'}
                                        </div>
                                        {/* Severity bar */}
                                        <div style={{ marginTop: 4, height: 3, background: 'var(--color-gray-100)', borderRadius: 2 }}>
                                            <div style={{
                                                width: `${need.severity * 10}%`, height: '100%', borderRadius: 2,
                                                background: need.severity >= 8 ? 'var(--color-coral-400)' : need.severity >= 5 ? 'var(--color-amber-400)' : 'var(--color-teal-400)',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : selectedCell ? (
                        <div className="raised-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                            No needs recorded for this cell
                        </div>
                    ) : (
                        <div className="raised-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                            <div style={{ marginBottom: 8 }}>Click a heatmap cell to inspect</div>
                            <div style={{ fontSize: 10 }}>
                                Hover for tooltips · Click to drill down
                            </div>
                        </div>
                    )}

                    {/* Quick navigation to related pages */}
                    <div className="raised-card mt-md fade-up" style={{ '--stagger': '0.25s' }}>
                        <div className="section-label mb-sm">Quick Links</div>
                        {[
                            { label: 'View All Alerts', path: '/alerts', icon: '▲', color: 'var(--color-coral-600)' },
                            { label: 'Needs Intelligence', path: '/needs', icon: '▤', color: 'var(--color-blue-600)' },
                            { label: 'Zone Map', path: '/zones', icon: '◫', color: 'var(--color-teal-600)' },
                            { label: 'Match Engine', path: '/match', icon: '⬡', color: 'var(--color-purple-600)' },
                        ].map((link, i) => (
                            <div key={i}
                                onClick={() => navigate(link.path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.4rem 0', fontSize: 11, cursor: 'pointer',
                                    color: 'var(--color-text-secondary)', transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = link.color}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                            >
                                <span>{link.icon}</span>
                                <span>{link.label}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 10 }}>→</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating tooltip */}
            {tooltip.visible && tooltip.content && (
                <div className="viz-tooltip visible" style={{
                    left: tooltip.x, top: tooltip.y,
                    transform: 'translate(-50%, -100%)',
                    pointerEvents: 'none',
                }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{tooltip.content.row} · {tooltip.content.col}</div>
                    <div>{tooltip.content.count} need{tooltip.content.count !== 1 ? 's' : ''} · avg severity: {tooltip.content.avgSeverity} · max: {tooltip.content.maxSeverity}</div>
                </div>
            )}
        </div>
    );
}
