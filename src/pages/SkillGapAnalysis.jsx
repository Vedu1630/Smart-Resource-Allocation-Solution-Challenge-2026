import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSkillGapAnalysis } from '../services/claude';

export default function SkillGapAnalysis() {
    const { needs, volunteers, settings } = useApp();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            const result = await getSkillGapAnalysis(needs, volunteers, settings.apiKey);
            setAnalysis(result);
            setLoading(false);
        }
        fetch();
    }, []);

    const severityColor = (sev) => {
        if (sev === 'critical') return { bg: 'var(--color-coral-50)', text: 'var(--color-coral-800)', border: 'var(--color-coral-200)' };
        if (sev === 'high') return { bg: 'var(--color-amber-50)', text: 'var(--color-amber-800)', border: 'var(--color-amber-200)' };
        if (sev === 'adequate') return { bg: 'var(--color-teal-50)', text: 'var(--color-teal-800)', border: 'var(--color-teal-200)' };
        return { bg: 'var(--color-blue-50)', text: 'var(--color-blue-800)', border: 'var(--color-blue-200)' };
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Skill Gap Analysis</h1>
                <p className="page-header-subtitle">AI-powered capability assessment</p>
            </div>

            {loading ? (
                <div>
                    <div className="grid-3 mb-lg">
                        {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}
                    </div>
                    <div className="skeleton skeleton-block" style={{ height: 200 }} />
                </div>
            ) : analysis ? (
                <div>
                    {/* Overall Score */}
                    <div className="grid-3 mb-lg">
                        <div className="metric-card fade-up" style={{ '--stagger': '0s' }}>
                            <div className="metric-card-label">Overall Readiness</div>
                            <div className="metric-card-value">{Math.round(analysis.overallScore || 62)}%</div>
                            <div className="progress-bar mt-sm">
                                <div className="progress-fill" style={{
                                    width: `${analysis.overallScore || 62}%`,
                                    background: (analysis.overallScore || 62) >= 70 ? 'var(--color-teal-500)' : 'var(--color-amber-500)',
                                }} />
                            </div>
                        </div>
                        <div className="metric-card fade-up" style={{ '--stagger': '0.05s' }}>
                            <div className="metric-card-label">Critical Gaps</div>
                            <div className="metric-card-value">{analysis.gaps?.filter(g => g.severity === 'critical').length || 0}</div>
                        </div>
                        <div className="metric-card fade-up" style={{ '--stagger': '0.1s' }}>
                            <div className="metric-card-label">Training Programs</div>
                            <div className="metric-card-value">{analysis.trainingPrograms?.length || 0}</div>
                        </div>
                    </div>

                    {/* Gap Matrix */}
                    <div className="raised-card mb-lg fade-up" style={{ '--stagger': '0.15s' }}>
                        <div className="section-label mb-md">Skill Gap Matrix</div>
                        <div>
                            {analysis.gaps?.map((gap, i) => {
                                const colors = severityColor(gap.severity);
                                const maxBar = Math.max(gap.demand, gap.supply, 1);

                                return (
                                    <div key={i} className="fade-up" style={{
                                        '--stagger': `${(i + 3) * 0.04}s`,
                                        padding: '0.75rem 0',
                                        borderBottom: i < analysis.gaps.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none',
                                    }}>
                                        <div className="flex justify-between items-center mb-sm">
                                            <span style={{ fontSize: 13, fontWeight: 500 }}>{gap.skill}</span>
                                            <span className="badge" style={{ background: colors.bg, color: colors.text }}>
                                                {gap.severity}
                                            </span>
                                        </div>

                                        {/* Visual bar comparison */}
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ width: 50, fontSize: 10, color: 'var(--color-text-tertiary)' }}>Demand</div>
                                            <div style={{ flex: 1, height: 8, background: 'var(--color-gray-100)', borderRadius: 4 }}>
                                                <div style={{
                                                    width: `${(gap.demand / maxBar) * 100}%`, height: '100%',
                                                    background: 'var(--color-coral-400)', borderRadius: 4,
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 11, width: 20, fontWeight: 500 }}>{gap.demand}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ width: 50, fontSize: 10, color: 'var(--color-text-tertiary)' }}>Supply</div>
                                            <div style={{ flex: 1, height: 8, background: 'var(--color-gray-100)', borderRadius: 4 }}>
                                                <div style={{
                                                    width: `${(gap.supply / maxBar) * 100}%`, height: '100%',
                                                    background: 'var(--color-teal-400)', borderRadius: 4,
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 11, width: 20, fontWeight: 500 }}>{gap.supply}</span>
                                        </div>

                                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                            {gap.recommendation}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid-2">
                        {/* Critical Flags */}
                        <div className="raised-card fade-up" style={{ '--stagger': '0.25s' }}>
                            <div className="section-label mb-sm">Critical Flags</div>
                            {analysis.criticalFlags?.map((flag, i) => (
                                <div key={i} style={{
                                    fontSize: 11, color: 'var(--color-coral-700)',
                                    background: 'var(--color-coral-50)', padding: '0.5rem 0.6rem',
                                    borderRadius: 'var(--radius-md)', marginBottom: 6,
                                }}>
                                    ▲ {flag}
                                </div>
                            ))}
                            {(!analysis.criticalFlags || analysis.criticalFlags.length === 0) && (
                                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No critical flags</div>
                            )}
                        </div>

                        {/* Training Programs */}
                        <div className="raised-card fade-up" style={{ '--stagger': '0.3s' }}>
                            <div className="section-label mb-sm">Recommended Training</div>
                            {analysis.trainingPrograms?.map((prog, i) => (
                                <div key={i} style={{
                                    padding: '0.6rem 0',
                                    borderBottom: i < analysis.trainingPrograms.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none',
                                }}>
                                    <div className="flex justify-between items-center mb-sm">
                                        <span style={{ fontSize: 12, fontWeight: 500 }}>{prog.name}</span>
                                        <span className={`badge ${prog.priority === 'critical' ? 'badge-coral' : prog.priority === 'high' ? 'badge-amber' : 'badge-blue'}`}>
                                            {prog.priority}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                        Duration: {prog.duration} · {prog.targetVolunteers?.length || 0} target volunteers
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
