import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DistrictGrid from '../components/iso/DistrictGrid';

export default function ZoneMap() {
    const { zones, needs, volunteers } = useApp();
    const [selectedZone, setSelectedZone] = useState(null);
    const [showGaps, setShowGaps] = useState(false);
    const [liveTimestamp, setLiveTimestamp] = useState(new Date());

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setLiveTimestamp(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const enrichedZones = zones.map(z => ({
        ...z,
        needCount: needs.filter(n => n.zone === z.id).length,
        openNeeds: needs.filter(n => n.zone === z.id && n.status === 'open').length,
        volunteerCount: volunteers.filter(v => v.zone === z.id).length,
        activeVolunteers: volunteers.filter(v => v.zone === z.id && v.status === 'active').length,
    }));

    const zone = selectedZone ? enrichedZones.find(z => z.id === selectedZone) : null;
    const zoneNeeds = selectedZone ? needs.filter(n => n.zone === selectedZone) : [];
    const zoneVols = selectedZone ? volunteers.filter(v => v.zone === selectedZone) : [];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-header-title">Zone Map View</h1>
                    <p className="page-header-subtitle">
                        <span className="live-dot"></span>
                        Isometric district overview
                    </p>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    {liveTimestamp.toLocaleTimeString()}
                </div>
            </div>

            <div className="grid-sidebar">
                <div>
                    {/* Interactive District Grid */}
                    <div className="raised-card mb-md fade-up" style={{ '--stagger': '0.1s' }}>
                        <div className="flex justify-between items-center mb-sm">
                            <div className="section-label" style={{ marginBottom: 0 }}>District Grid</div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                                <input type="checkbox" checked={showGaps} onChange={e => setShowGaps(e.target.checked)} />
                                Coverage gaps
                            </label>
                        </div>
                        <DistrictGrid
                            zones={enrichedZones}
                            onZoneClick={setSelectedZone}
                            selectedZone={selectedZone}
                        />
                        {showGaps && (
                            <div className="fade-up" style={{ '--stagger': '0.05s', marginTop: 8 }}>
                                <div className="section-label mb-sm">Coverage Gap Analysis</div>
                                {enrichedZones.filter(z => z.coverage < 70).map(z => (
                                    <div key={z.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.35rem 0', fontSize: 11,
                                        borderBottom: '0.5px solid var(--color-gray-100)',
                                    }}>
                                        <span style={{ fontWeight: 500 }}>{z.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 60, height: 4, background: 'var(--color-gray-100)', borderRadius: 2 }}>
                                                <div style={{
                                                    width: `${z.coverage}%`, height: '100%', borderRadius: 2,
                                                    background: z.coverage < 50 ? 'var(--color-coral-400)' : 'var(--color-amber-400)',
                                                    transition: 'width 0.5s ease',
                                                }} />
                                            </div>
                                            <span style={{ color: z.coverage < 50 ? 'var(--color-coral-600)' : 'var(--color-amber-600)', fontWeight: 500 }}>
                                                {z.coverage}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {enrichedZones.filter(z => z.coverage < 70).length === 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-teal-600)' }}>All zones above 70% coverage ✓</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Zone Summary Table */}
                    <div className="raised-card fade-up" style={{ '--stagger': '0.2s' }}>
                        <div className="section-label mb-sm">Zone Summary</div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Zone</th>
                                    <th>Needs</th>
                                    <th>Volunteers</th>
                                    <th>Urgency</th>
                                    <th>Coverage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichedZones.map(z => (
                                    <tr key={z.id}
                                        onClick={() => setSelectedZone(z.id)}
                                        style={{
                                            cursor: 'pointer',
                                            background: selectedZone === z.id ? 'var(--color-teal-50)' : undefined,
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <td style={{ fontWeight: 500 }}>{z.name}</td>
                                        <td>
                                            <span>{z.needCount}</span>
                                            {z.openNeeds > 0 && (
                                                <span style={{ fontSize: 10, color: 'var(--color-coral-500)', marginLeft: 4 }}>
                                                    ({z.openNeeds} open)
                                                </span>
                                            )}
                                        </td>
                                        <td>{z.volunteerCount}</td>
                                        <td>
                                            <span className={`badge ${z.urgency === 'critical' ? 'badge-coral' : z.urgency === 'high' ? 'badge-amber' : 'badge-teal'}`}>
                                                {z.urgency}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 40, height: 4, background: 'var(--color-gray-100)', borderRadius: 2 }}>
                                                    <div style={{
                                                        width: `${z.coverage}%`, height: '100%', borderRadius: 2,
                                                        background: z.coverage >= 70 ? 'var(--color-teal-400)' : z.coverage >= 50 ? 'var(--color-amber-400)' : 'var(--color-coral-400)',
                                                        transition: 'width 0.5s ease',
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 11 }}>{z.coverage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Zone Detail Panel */}
                <div>
                    {zone ? (
                        <div className="raised-card fade-up" style={{ '--stagger': '0.15s', position: 'sticky', top: 80 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 500 }}>{zone.name}</h3>
                                <span className={`badge ${zone.urgency === 'critical' ? 'badge-coral pulse-critical' : zone.urgency === 'high' ? 'badge-amber' : 'badge-teal'}`}>
                                    {zone.urgency}
                                </span>
                            </div>

                            {/* Zone KPIs */}
                            <div className="grid-2 mb-md">
                                {[
                                    { label: 'Total Needs', value: zone.needCount, color: 'var(--color-blue-600)' },
                                    { label: 'Open Needs', value: zone.openNeeds, color: 'var(--color-coral-600)' },
                                    { label: 'Volunteers', value: zone.volunteerCount, color: 'var(--color-teal-600)' },
                                    { label: 'Coverage', value: `${zone.coverage}%`, color: 'var(--color-teal-600)' },
                                ].map((m, i) => (
                                    <div key={i} style={{
                                        background: 'var(--color-gray-50)', padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{m.label}</div>
                                        <div style={{ fontSize: 18, fontWeight: 500, color: m.color }}>{m.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Coverage Progress */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div className="section-label">Coverage Level</div>
                                <div className="progress-bar" style={{ height: 8 }}>
                                    <div className="progress-fill" style={{
                                        width: `${zone.coverage}%`,
                                        background: zone.coverage >= 70 ? 'var(--color-teal-400)' : zone.coverage >= 50 ? 'var(--color-amber-400)' : 'var(--color-coral-400)',
                                    }} />
                                </div>
                            </div>

                            {/* Needs in zone */}
                            <div className="section-label">Needs in Zone</div>
                            {zoneNeeds.slice(0, 5).map(n => (
                                <div key={n.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.35rem 0', fontSize: 11,
                                    borderBottom: '0.5px solid var(--color-gray-100)',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span className="truncate" style={{ flex: 1 }}>{n.title}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                        <span className={`badge ${n.severity >= 8 ? 'badge-coral' : n.severity >= 5 ? 'badge-amber' : 'badge-teal'}`}>
                                            {n.severity}
                                        </span>
                                        <span className={`badge ${n.status === 'open' ? 'badge-coral' : n.status === 'active' ? 'badge-teal' : 'badge-gray'}`}>
                                            {n.status}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Volunteers in zone */}
                            <div className="section-label" style={{ marginTop: '0.75rem' }}>Volunteers in Zone</div>
                            {zoneVols.slice(0, 5).map(v => (
                                <div key={v.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.35rem 0', fontSize: 11,
                                    borderBottom: '0.5px solid var(--color-gray-100)',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{
                                            width: 18, height: 18, borderRadius: '50%',
                                            background: v.status === 'active' ? 'var(--color-teal-100)' : 'var(--color-gray-100)',
                                            color: v.status === 'active' ? 'var(--color-teal-700)' : 'var(--color-gray-500)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 7, fontWeight: 500,
                                        }}>
                                            {v.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        {v.name}
                                    </div>
                                    <span className={`badge ${v.status === 'active' ? 'badge-teal' : 'badge-gray'}`}>
                                        {v.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="raised-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                            Click a zone to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
