import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

export default function ReportAggregator() {
    const { mergeNeeds, settings } = useApp();
    const [reportText, setReportText] = useState('');
    const [fileName, setFileName] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [conflicts, setConflicts] = useState([]);
    const [confirmed, setConfirmed] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (ev) => setReportText(ev.target.result);
            reader.readAsText(file);
        }
    };

    const handleExtract = async () => {
        if (!reportText.trim()) return;
        setLoading(true);
        setExtractedData(null);
        setConfirmed(false);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: reportText })
            });
            const result = await response.json();
            
            if (response.ok) {
                setExtractedData(result);
                if (result.warnings?.length > 0) {
                    setConflicts(result.warnings);
                }
            } else {
                console.error(result.error);
                setConflicts(['Failed to communicate with AI backend.']);
            }
        } catch (err) {
            console.error('Extraction failed:', err);
            setConflicts(['Server connection error.']);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (extractedData?.extractedNeeds) {
            const newNeeds = extractedData.extractedNeeds.map((n, i) => ({
                id: `n${Date.now()}-${i}`,
                title: n.title,
                category: n.category,
                severity: n.severity,
                zone: n.zone || 'z1',
                status: 'open',
                description: n.description,
                reportedAt: new Date().toISOString(),
                assignedTo: null,
                gps: { lat: 19.076, lng: 72.877 },
            }));
            mergeNeeds(newNeeds);
            setConfirmed(true);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Report Aggregator</h1>
                <p className="page-header-subtitle">AI-powered report extraction</p>
            </div>

            {/* Upload */}
            <div className="raised-card mb-lg fade-up" style={{ '--stagger': '0.05s' }}>
                <div className="section-label mb-sm">Upload Report</div>
                <div className="grid-2">
                    <div>
                        <div className="form-group">
                            <label className="form-label">File Upload (PDF/Text)</label>
                            <input type="file" className="form-input" accept=".pdf,.txt,.csv,.doc,.docx"
                                onChange={handleFileUpload} />
                        </div>
                        {fileName && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                Loaded: {fileName}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="form-group">
                            <label className="form-label">Or paste report text</label>
                            <textarea className="form-textarea" rows={4} value={reportText}
                                onChange={e => setReportText(e.target.value)}
                                placeholder="Paste field report content here..."
                            />
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                    <button className="btn btn-purple" onClick={handleExtract} disabled={!reportText.trim() || loading}>
                        {loading ? 'Extracting...' : '◈ Extract with AI'}
                    </button>
                </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div className="raised-card mb-lg fade-up">
                    <div className="section-label mb-sm">Extracting Data...</div>
                    <div className="skeleton skeleton-block" style={{ marginBottom: 8 }} />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                </div>
            )}

            {/* Extracted Data Preview */}
            {extractedData && !loading && (
                <div className="raised-card mb-lg fade-up" style={{ '--stagger': '0.1s' }}>
                    <div className="flex justify-between items-center mb-md">
                        <div>
                            <div className="section-label" style={{ marginBottom: 0 }}>Extracted Needs</div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                Confidence: {Math.round((extractedData.confidence || 0) * 100)}%
                            </span>
                        </div>
                        <span className="badge badge-purple">{extractedData.extractedNeeds?.length || 0} needs found</span>
                    </div>

                    {extractedData.extractedNeeds?.map((need, i) => (
                        <div key={i} className="raised-card mb-sm fade-up" style={{
                            '--stagger': `${(i + 2) * 0.05}s`,
                            background: 'var(--color-gray-50)',
                        }}>
                            <div className="flex justify-between items-center mb-sm">
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{need.title}</span>
                                <span className={`badge ${need.severity >= 8 ? 'badge-coral' : need.severity >= 5 ? 'badge-amber' : 'badge-teal'}`}>
                                    Severity {need.severity}
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                                {need.category} {need.zone ? `· Zone ${need.zone}` : ''}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                {need.description}
                            </div>
                        </div>
                    ))}

                    {/* Conflict resolution */}
                    {conflicts.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                            <div className="section-label">Warnings</div>
                            {conflicts.map((c, i) => (
                                <div key={i} style={{
                                    fontSize: 11, color: 'var(--color-amber-700)',
                                    background: 'var(--color-amber-50)', padding: '0.4rem 0.6rem',
                                    borderRadius: 'var(--radius-md)', marginBottom: 4,
                                }}>
                                    ⚠ {c}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Confirm */}
                    {!confirmed ? (
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary" onClick={handleConfirm}>
                                Confirm & Add to Database
                            </button>
                            <button className="btn btn-secondary" onClick={() => setExtractedData(null)}>
                                Discard
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            marginTop: '1rem', padding: '0.75rem',
                            background: 'var(--color-teal-50)', borderRadius: 'var(--radius-md)',
                            fontSize: 12, color: 'var(--color-teal-700)',
                        }}>
                            ✓ {extractedData.extractedNeeds?.length} needs added to database successfully.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
