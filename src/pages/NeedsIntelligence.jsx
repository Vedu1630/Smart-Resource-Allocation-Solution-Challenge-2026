import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function NeedsIntelligence() {
    const { needs, zones, settings } = useApp();
    const [sortField, setSortField] = useState('severity');
    const [sortDir, setSortDir] = useState('desc');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [aiInsight, setAiInsight] = useState(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [hoveredRow, setHoveredRow] = useState(null);
    const [sparkHover, setSparkHover] = useState(null);

    const categories = [...new Set(needs.map(n => n.category))];

    useEffect(() => {
        async function fetchInsight() {
            setAiLoading(true);
            await new Promise(r => setTimeout(r, 1000));
            setAiInsight({
                topInsight: "Most needs are concentrated in Medical sector.",
                trends: [{ category: "Medical", direction: "up", note: "Spiking rapidly" }],
                recommendation: "Deploy more medical units to Zone 1."
            });
            setAiLoading(false);
        }
        fetchInsight();
    }, []);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filtered = needs
        .filter(n => !filterCategory || n.category === filterCategory)
        .filter(n => !filterStatus || n.status === filterStatus)
        .sort((a, b) => {
            let va = a[sortField], vb = b[sortField];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });

    // Interactive sparkline with hover data points
    const InteractiveSparkline = ({ category, rowId }) => {
        const catNeeds = needs.filter(n => n.category === category);
        if (catNeeds.length < 2) return <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>—</span>;

        const values = catNeeds.slice(0, 6).map(n => n.severity);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;
        const points = values.map((v, i) => ({
            x: i * 18 + 6,
            y: 26 - ((v - min) / range) * 20,
            value: v,
        }));
        const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
        const isRowHovered = hoveredRow === rowId;

        return (
            <div style={{ position: 'relative' }}>
                <svg width="110" height="34" style={{ display: 'block' }}
                    onMouseLeave={() => setSparkHover(null)}
                >
                    {/* Area fill */}
                    <polygon
                        points={`${points[0].x},30 ${polyline} ${points[points.length - 1].x},30`}
                        fill={isRowHovered ? 'var(--color-blue-100)' : 'var(--color-blue-50)'}
                        style={{ transition: 'fill 0.2s' }}
                    />
                    {/* Line */}
                    <polyline points={polyline}
                        fill="none"
                        stroke={isRowHovered ? 'var(--color-blue-500)' : 'var(--color-blue-400)'}
                        strokeWidth={isRowHovered ? 2 : 1.5}
                        strokeLinejoin="round" strokeLinecap="round"
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                    />
                    {/* Interactive dots */}
                    {points.map((p, i) => (
                        <g key={i}
                            onMouseEnter={() => setSparkHover({ rowId, idx: i, value: p.value, x: p.x, y: p.y })}
                        >
                            <circle cx={p.x} cy={p.y}
                                r={sparkHover?.rowId === rowId && sparkHover?.idx === i ? 4 : (isRowHovered ? 2.5 : 0)}
                                fill="var(--color-blue-500)" stroke="white" strokeWidth={1}
                                style={{ transition: 'r 0.15s' }}
                            />
                            {/* Tooltip */}
                            {sparkHover?.rowId === rowId && sparkHover?.idx === i && (
                                <g>
                                    <rect x={p.x - 12} y={p.y - 18} width={24} height={14} rx={3}
                                        fill="var(--color-gray-900)" />
                                    <text x={p.x} y={p.y - 8}
                                        textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)"
                                        fill="white" fontWeight="500">
                                        {p.value}
                                    </text>
                                </g>
                            )}
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    // Animated severity bar
    const SeverityBar = ({ severity, index }) => {
        const [animated, setAnimated] = useState(false);
        const ref = useRef(null);

        useEffect(() => {
            const timer = setTimeout(() => setAnimated(true), index * 40 + 200);
            return () => clearTimeout(timer);
        }, [index]);

        const fill = severity >= 8 ? 'var(--color-coral-400)' : severity >= 5 ? 'var(--color-amber-400)' : 'var(--color-teal-400)';

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500, fontSize: 13, width: 16 }}>{severity}</span>
                <svg width="60" height="8" ref={ref}>
                    <rect x={0} y={0} width={60} height={8} rx={3} fill="var(--color-gray-100)" />
                    <rect x={0} y={0}
                        width={animated ? severity * 6 : 0} height={8} rx={3}
                        fill={fill}
                        style={{ transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                    />
                </svg>
            </div>
        );
    };

    const statusBadge = (status) => {
        const map = { open: 'badge-coral', active: 'badge-teal', done: 'badge-gray' };
        return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Needs Intelligence</h1>
                <p className="page-header-subtitle">
                    <span className="live-dot"></span>
                    Ranked analysis of community needs
                </p>
            </div>

            <div className="grid-sidebar">
                <div>
                    {/* Filters */}
                    <div className="flex gap-sm mb-md fade-up" style={{ '--stagger': '0.05s' }}>
                        <select className="form-select" style={{ width: 'auto' }} value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 'auto' }} value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="active">Active</option>
                            <option value="done">Done</option>
                        </select>
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', alignSelf: 'center', marginLeft: 'auto' }}>
                            {filtered.length} results
                        </span>
                    </div>

                    {/* Category summary bar */}
                    <div className="raised-card mb-md fade-up" style={{ '--stagger': '0.08s' }}>
                        <div className="section-label mb-sm">Category Distribution</div>
                        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
                            {categories.map((cat, i) => {
                                const count = needs.filter(n => n.category === cat).length;
                                const pct = (count / needs.length) * 100;
                                const colors = ['var(--color-teal-400)', 'var(--color-blue-400)', 'var(--color-purple-400)', 'var(--color-coral-400)', 'var(--color-amber-400)'];
                                return (
                                    <div key={cat}
                                        style={{
                                            width: `${pct}%`, background: colors[i % colors.length],
                                            transition: 'width 0.5s ease',
                                            cursor: 'pointer',
                                        }}
                                        title={`${cat}: ${count} needs (${Math.round(pct)}%)`}
                                        onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                                    />
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 8 }}>
                            {categories.slice(0, 5).map((cat, i) => {
                                const count = needs.filter(n => n.category === cat).length;
                                const colors = ['var(--color-teal-400)', 'var(--color-blue-400)', 'var(--color-purple-400)', 'var(--color-coral-400)', 'var(--color-amber-400)'];
                                return (
                                    <span key={cat}
                                        onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                                        style={{
                                            fontSize: 9, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer',
                                            color: filterCategory === cat ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                            fontWeight: filterCategory === cat ? 500 : 400,
                                        }}
                                    >
                                        <span style={{ width: 6, height: 6, borderRadius: 1, background: colors[i % colors.length], display: 'inline-block' }} />
                                        {cat} ({count})
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="raised-card fade-up" style={{ '--stagger': '0.1s', overflow: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="sortable" onClick={() => toggleSort('severity')}>
                                        Severity {sortField === 'severity' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="sortable" onClick={() => toggleSort('title')}>
                                        Need {sortField === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th>Category</th>
                                    <th>Zone</th>
                                    <th>Status</th>
                                    <th>Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((need, i) => (
                                    <tr key={need.id}
                                        className="fade-up"
                                        style={{ '--stagger': `${(i + 3) * 0.03}s` }}
                                        onMouseEnter={() => setHoveredRow(need.id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td>
                                            <SeverityBar severity={need.severity} index={i} />
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'var(--color-text-primary)', maxWidth: 200 }} className="truncate">
                                            {need.title}
                                        </td>
                                        <td>
                                            <span className="tag" style={{ cursor: 'pointer' }}
                                                onClick={() => setFilterCategory(filterCategory === need.category ? '' : need.category)}>
                                                {need.category}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 11 }}>{zones.find(z => z.id === need.zone)?.name || need.zone}</td>
                                        <td>{statusBadge(need.status)}</td>
                                        <td>
                                            <InteractiveSparkline category={need.category} rowId={need.id} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Insight Sidebar */}
                <div className="raised-card fade-up" style={{ '--stagger': '0.15s', alignSelf: 'start', position: 'sticky', top: 80 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span className="badge badge-purple">AI Insight</span>
                    </div>

                    {aiLoading ? (
                        <div>
                            <div className="skeleton skeleton-text" />
                            <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                            <div className="skeleton skeleton-block" style={{ height: 60, marginTop: 12 }} />
                        </div>
                    ) : aiInsight ? (
                        <div>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                                {aiInsight.topInsight || aiInsight.message || 'Analysis complete.'}
                            </p>
                            {aiInsight.trends?.length > 0 && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div className="section-label">Category Trends</div>
                                    {aiInsight.trends.map((t, i) => (
                                        <div key={i}
                                            style={{
                                                fontSize: 11, padding: '0.35rem 0', display: 'flex', justifyContent: 'space-between',
                                                cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            onClick={() => setFilterCategory(t.category)}
                                        >
                                            <span>{t.category}</span>
                                            <span style={{
                                                color: t.direction === 'up' ? 'var(--color-coral-600)' : t.direction === 'down' ? 'var(--color-teal-600)' : 'var(--color-gray-500)',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    transform: t.direction === 'up' ? 'rotate(0)' : t.direction === 'down' ? 'rotate(180deg)' : 'rotate(90deg)',
                                                    transition: 'transform 0.2s',
                                                }}>▲</span>
                                                {t.note}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {aiInsight.recommendation && (
                                <div style={{
                                    fontSize: 11, color: 'var(--color-purple-700)',
                                    background: 'var(--color-purple-50)', padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: '3px solid var(--color-purple-300)',
                                }}>
                                    {aiInsight.recommendation}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
