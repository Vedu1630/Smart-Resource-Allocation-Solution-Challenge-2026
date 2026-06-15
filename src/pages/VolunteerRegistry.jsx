import { useState } from 'react';
import { useApp } from '../context/AppContext';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ALL_SKILLS = ['Medical', 'First Aid', 'CPR', 'Teaching', 'Child Care', 'Cooking', 'Construction', 'Plumbing', 'Electrical', 'Welding', 'Driving', 'Logistics', 'Inventory', 'IT Support', 'Data Entry', 'Counseling', 'Translation', 'Admin'];

export default function VolunteerRegistry() {
    const { volunteers, zones, needs, updateVolunteer } = useApp();
    const [search, setSearch] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [hoveredDay, setHoveredDay] = useState(null);

    const filtered = volunteers
        .filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase()))
        .filter(v => !skillFilter || v.skills?.includes(skillFilter));

    const selected = selectedId ? volunteers.find(v => v.id === selectedId) : null;

    // Compute skill usage stats
    const skillUsage = ALL_SKILLS.map(skill => ({
        skill,
        count: volunteers.filter(v => v.skills?.includes(skill)).length,
    })).sort((a, b) => b.count - a.count);

    // Weekly global availability heatmap
    const availByDay = DAYS.map(day => ({
        day,
        available: volunteers.filter(v => v.status === 'active' && v.availability?.[day]).length,
        total: volunteers.filter(v => v.status === 'active').length,
    }));
    const maxAvail = Math.max(...availByDay.map(d => d.available));

    // Toggle volunteer availability on click
    const toggleAvailability = (day) => {
        if (!selected) return;
        const currentAvail = selected.availability || {};
        updateVolunteer({
            id: selected.id,
            availability: { ...currentAvail, [day]: !currentAvail[day] },
        });
    };

    const IsoProfileCard = ({ volunteer }) => {
        const [cardHovered, setCardHovered] = useState(false);
        const w = 80, h = 50;
        const dx = w * 0.4, dy = w * 0.25;
        const x = 40, topY = 30;
        const fill = volunteer.status === 'active' ? '#14b8a6' : '#a1a1aa';

        return (
            <svg viewBox="0 0 180 120" style={{ width: 180, height: 'auto', cursor: 'pointer' }}
                onMouseEnter={() => setCardHovered(true)} onMouseLeave={() => setCardHovered(false)}>
                {[0, 45, 90, 135, 180].map(gx => (
                    <line key={gx} x1={gx} y1={0} x2={gx} y2={120}
                        stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.35" />
                ))}
                <g className="iso-cube" style={{ transform: cardHovered ? 'translateY(-4px)' : 'none', transition: 'transform 0.25s' }}>
                    <polygon points={`${x},${topY} ${x + dx},${topY - dy} ${x + w},${topY} ${x + dx},${topY + dy}`}
                        fill={fill} opacity={cardHovered ? 0.7 : 0.5} stroke="var(--color-gray-700)" strokeWidth={cardHovered ? 1.2 : 0.8} />
                    <polygon points={`${x},${topY} ${x + dx},${topY + dy} ${x + dx},${topY + dy + h} ${x},${topY + h}`}
                        fill={fill} opacity={cardHovered ? 1 : 0.8} stroke="var(--color-gray-700)" strokeWidth={cardHovered ? 1.2 : 0.8} />
                    <polygon points={`${x + dx},${topY + dy} ${x + w},${topY} ${x + w},${topY + h} ${x + dx},${topY + dy + h}`}
                        fill={fill} opacity={cardHovered ? 0.55 : 0.4} stroke="var(--color-gray-700)" strokeWidth={cardHovered ? 1.2 : 0.8} />
                    <text x={x + dx - 5} y={topY + dy + h / 2 + 5}
                        fontSize="16" fontFamily="var(--font-mono)" fontWeight="500"
                        fill="white" textAnchor="middle">
                        {volunteer.name.split(' ').map(n => n[0]).join('')}
                    </text>
                </g>
                {/* Hours badge */}
                <g>
                    <rect x={120} y={80} width={50} height={18} rx={4} fill="var(--color-gray-900)" />
                    <text x={145} y={92} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="white" fontWeight="500">
                        {Math.round(volunteer.hoursLogged)}h
                    </text>
                </g>
            </svg>
        );
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Volunteer Registry</h1>
                <p className="page-header-subtitle">Searchable roster and profiles</p>
            </div>

            {/* Global availability heatmap */}
            <div className="raised-card mb-md fade-up" style={{ '--stagger': '0.05s' }}>
                <div className="flex justify-between items-center mb-sm">
                    <div className="section-label" style={{ marginBottom: 0 }}>
                        <span className="live-dot"></span>
                        Team Availability This Week
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
                    {availByDay.map((d, i) => {
                        const pct = maxAvail > 0 ? (d.available / maxAvail) * 100 : 0;
                        const isHov = hoveredDay === d.day;
                        return (
                            <div key={d.day}
                                style={{ flex: 1, textAlign: 'center', position: 'relative', cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredDay(d.day)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                {/* Tooltip */}
                                {isHov && (
                                    <div className="viz-tooltip visible" style={{
                                        position: 'absolute', bottom: `${pct + 10}%`, left: '50%', transform: 'translateX(-50%)',
                                    }}>
                                        {d.available}/{d.total} active
                                    </div>
                                )}
                                <div style={{
                                    height: `${pct}%`, minHeight: 4,
                                    background: isHov ? 'var(--color-teal-500)' : 'var(--color-teal-400)',
                                    borderRadius: '3px 3px 0 0',
                                    transition: 'height 0.4s ease, background 0.15s',
                                    opacity: isHov ? 1 : 0.75,
                                }} />
                                <div style={{
                                    fontSize: 9, color: isHov ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                    marginTop: 4, fontWeight: isHov ? 500 : 400,
                                    transition: 'color 0.15s',
                                }}>
                                    {DAY_LABELS[i]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-sm mb-md fade-up" style={{ '--stagger': '0.08s' }}>
                <input className="form-input" placeholder="Search by name or email..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 300 }}
                />
                <select className="form-select" style={{ width: 'auto' }}
                    value={skillFilter} onChange={e => setSkillFilter(e.target.value)}>
                    <option value="">All Skills</option>
                    {ALL_SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', alignSelf: 'center', marginLeft: 'auto' }}>
                    {filtered.length} volunteers
                </span>
            </div>

            <div className="grid-sidebar">
                {/* Roster list */}
                <div>
                    <div className="raised-card fade-up" style={{ '--stagger': '0.1s', overflow: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Skills</th>
                                    <th>Zone</th>
                                    <th>Hours</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((v, i) => (
                                    <tr key={v.id}
                                        onClick={() => setSelectedId(v.id)}
                                        style={{
                                            cursor: 'pointer',
                                            background: selectedId === v.id ? 'var(--color-teal-50)' : undefined,
                                            transition: 'background 0.15s',
                                        }}
                                        className="fade-up"
                                    >
                                        <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: v.status === 'active' ? 'var(--color-teal-100)' : 'var(--color-gray-100)',
                                                    color: v.status === 'active' ? 'var(--color-teal-700)' : 'var(--color-gray-500)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 9, fontWeight: 500, transition: 'background 0.15s',
                                                }}>
                                                    {v.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                {v.name}
                                            </div>
                                        </td>
                                        <td>
                                            {(v.skills || []).slice(0, 2).map(s => (
                                                <span key={s} className="tag" style={{ cursor: 'pointer' }}
                                                    onClick={(e) => { e.stopPropagation(); setSkillFilter(skillFilter === s ? '' : s); }}>
                                                    {s}
                                                </span>
                                            ))}
                                            {(v.skills || []).length > 2 && <span className="tag">+{(v.skills || []).length - 2}</span>}
                                        </td>
                                        <td style={{ fontSize: 11 }}>{zones.find(z => z.id === v.zone)?.name || v.zone}</td>
                                        <td style={{ fontWeight: 500 }}>{Math.round(v.hoursLogged || 0)}</td>
                                        <td>
                                            <span className={`badge ${v.status === 'active' ? 'badge-teal' : 'badge-gray'}`}>
                                                {v.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Profile sidebar */}
                <div>
                    {selected ? (
                        <div className="raised-card fade-up" style={{ '--stagger': '0.15s', position: 'sticky', top: 80 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                <IsoProfileCard volunteer={selected} />
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <div style={{ fontSize: 15, fontWeight: 500 }}>{selected.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{selected.email}</div>
                                <span className={`badge ${selected.status === 'active' ? 'badge-teal' : 'badge-gray'} mt-sm`}>
                                    {selected.status}
                                </span>
                            </div>

                            {/* Skills */}
                            <div className="section-label">Skills</div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                {selected.skills?.map(s => (
                                    <span key={s} className="tag" style={{ cursor: 'pointer' }}
                                        onClick={() => setSkillFilter(skillFilter === s ? '' : s)}>
                                        {s}
                                    </span>
                                ))}
                            </div>

                            {/* Languages */}
                            <div className="section-label">Languages</div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                {selected.languages?.map(l => <span key={l} className="tag">{l}</span>)}
                            </div>

                            {/* Interactive Availability Heatmap */}
                            <div className="section-label">Weekly Availability <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>(click to toggle)</span></div>
                            <div style={{ display: 'flex', gap: 4, marginBottom: '0.75rem' }}>
                                {DAYS.map((d, i) => {
                                    const isAvail = selected.availability?.[d];
                                    const isHov = hoveredDay === `profile-${d}`;
                                    return (
                                        <div key={d} style={{ textAlign: 'center' }}
                                            onMouseEnter={() => setHoveredDay(`profile-${d}`)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        >
                                            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{DAY_LABELS[i]}</div>
                                            <div className="avail-cell"
                                                onClick={() => toggleAvailability(d)}
                                                style={{
                                                    width: 28, height: 28,
                                                    background: isAvail ? 'var(--color-teal-400)' : 'var(--color-gray-100)',
                                                    opacity: isHov ? 1 : (isAvail ? 0.8 : 0.5),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, color: isAvail ? 'white' : 'var(--color-gray-400)',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {isAvail ? '✓' : '—'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Stats */}
                            <div className="section-label">Stats</div>
                            <div style={{ fontSize: 12 }}>
                                <div className="flex justify-between" style={{ padding: '0.3rem 0' }}>
                                    <span className="text-muted">Hours logged</span>
                                    <span style={{ fontWeight: 500 }}>{Math.round(selected.hoursLogged || 0)}</span>
                                </div>
                                <div className="flex justify-between" style={{ padding: '0.3rem 0' }}>
                                    <span className="text-muted">Matches</span>
                                    <span style={{ fontWeight: 500 }}>{selected.matchHistory?.length || 0}</span>
                                </div>
                                <div className="flex justify-between" style={{ padding: '0.3rem 0' }}>
                                    <span className="text-muted">Zone</span>
                                    <span style={{ fontWeight: 500 }}>{zones.find(z => z.id === selected.zone)?.name || selected.zone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between" style={{ padding: '0.3rem 0' }}>
                                    <span className="text-muted">Joined</span>
                                    <span style={{ fontWeight: 500 }}>{selected.joinDate ? new Date(selected.joinDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            {/* Match History */}
                            {(selected.matchHistory?.length || 0) > 0 && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <div className="section-label">Match History</div>
                                    {selected.matchHistory?.map(nId => {
                                        const need = needs.find(n => n.id === nId);
                                        return need ? (
                                            <div key={nId} style={{
                                                fontSize: 11, padding: '0.3rem 0',
                                                borderBottom: '0.5px solid var(--color-gray-100)',
                                                display: 'flex', justifyContent: 'space-between',
                                                cursor: 'pointer', transition: 'background 0.15s',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span className="truncate" style={{ flex: 1 }}>{need.title}</span>
                                                <span className={`badge ${need.status === 'done' ? 'badge-teal' : 'badge-gray'}`} style={{ marginLeft: 4 }}>
                                                    {need.status}
                                                </span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="raised-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                            Select a volunteer to view profile
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
