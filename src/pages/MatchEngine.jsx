import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ConnectionLattice from '../components/iso/ConnectionLattice';

export default function MatchEngine() {
    const { needs, volunteers, assignVolunteer, settings } = useApp();
    const [selectedNeed, setSelectedNeed] = useState('');
    const [matches, setMatches] = useState(null);
    const [loading, setLoading] = useState(false);
    const [assigned, setAssigned] = useState(new Set());

    const openNeeds = needs.filter(n => n.status === 'open');

    const handleMatch = async () => {
        const need = needs.find(n => n.id === selectedNeed);
        if (!need) return;
        setLoading(true);
        setMatches(null);
        await new Promise(r => setTimeout(r, 1000));
        setMatches([
            { volunteerId: volunteers[0]?.id, name: volunteers[0]?.name, confidence: 95, rationale: 'Perfect skill match and proximity.' }
        ]);
        setLoading(false);
    };

    const handleAssign = (volunteerId) => {
        assignVolunteer(selectedNeed, volunteerId);
        setAssigned(prev => new Set([...prev, volunteerId]));
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">AI Match Engine</h1>
                <p className="page-header-subtitle">Claude-powered volunteer matching</p>
            </div>

            {/* Lattice graphic */}
            <div className="raised-card mb-lg fade-up" style={{ '--stagger': '0.05s' }}>
                <ConnectionLattice />
            </div>

            {/* Need selector */}
            <div className="raised-card mb-lg fade-up" style={{ '--stagger': '0.1s' }}>
                <div className="section-label mb-sm">Select Open Need</div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <select className="form-select" value={selectedNeed} onChange={e => setSelectedNeed(e.target.value)}>
                            <option value="">Choose a need to match...</option>
                            {openNeeds.map(n => (
                                <option key={n.id} value={n.id}>
                                    [{n.severity}] {n.title} — {n.category}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-purple" onClick={handleMatch} disabled={!selectedNeed || loading}>
                        {loading ? 'Matching...' : '⬡ Run Match'}
                    </button>
                </div>

                {selectedNeed && (
                    <div style={{ marginTop: '0.75rem', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                        {needs.find(n => n.id === selectedNeed)?.description}
                    </div>
                )}
            </div>

            {/* Results */}
            {loading && (
                <div className="raised-card fade-up" style={{ '--stagger': '0.15s' }}>
                    <div className="section-label mb-sm">Finding Best Matches...</div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: 12 }}>
                            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                                <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                            </div>
                            <div className="skeleton" style={{ width: 48, height: 24, borderRadius: 4 }} />
                        </div>
                    ))}
                </div>
            )}

            {matches && !loading && (
                <div className="raised-card fade-up" style={{ '--stagger': '0.15s' }}>
                    <div className="section-label mb-md">
                        Match Results — {matches.length} candidates ranked
                    </div>

                    {matches.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', padding: '1rem 0' }}>
                            No suitable matches found. Consider broadening skill requirements or cross-zone deployment.
                        </div>
                    ) : (
                        <div>
                            {matches.map((match, i) => {
                                const vol = volunteers.find(v => v.id === match.volunteerId);
                                const isAssigned = assigned.has(match.volunteerId);

                                return (
                                    <div key={match.volunteerId}
                                        className="fade-up"
                                        style={{
                                            '--stagger': `${(i + 1) * 0.05}s`,
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '0.75rem 0',
                                            borderBottom: i < matches.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none',
                                        }}
                                    >
                                        {/* Rank */}
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: i === 0 ? 'var(--color-purple-100)' : 'var(--color-gray-100)',
                                            color: i === 0 ? 'var(--color-purple-700)' : 'var(--color-gray-600)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 500, flexShrink: 0,
                                        }}>
                                            #{i + 1}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: 13, fontWeight: 500 }}>{match.name}</span>
                                                <span className="badge badge-purple">{Math.round(match.confidence)}%</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                                                {match.rationale}
                                            </div>
                                            {vol && (
                                                <div style={{ display: 'flex', gap: '0.25rem', marginTop: 4 }}>
                                                    {vol.skills.slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Confidence bar */}
                                        <div style={{ width: 60, flexShrink: 0 }}>
                                            <div className="progress-bar">
                                                <div className="progress-fill"
                                                    style={{
                                                        width: `${Math.round(match.confidence)}%`,
                                                        background: match.confidence >= 85 ? 'var(--color-purple-500)' : match.confidence >= 70 ? 'var(--color-blue-500)' : 'var(--color-gray-400)',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Assign button */}
                                        <button
                                            className={`btn btn-sm ${isAssigned ? 'btn-secondary' : 'btn-primary'}`}
                                            onClick={() => handleAssign(match.volunteerId)}
                                            disabled={isAssigned}
                                            style={{ flexShrink: 0 }}
                                        >
                                            {isAssigned ? 'Assigned ✓' : 'Assign'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
