import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { autoCategorize } from '../services/claude';

const STEPS = ['Location', 'Category', 'Severity', 'Description', 'Review'];
const CATEGORIES = ['Medical', 'Food & Nutrition', 'Infrastructure', 'Water & Sanitation', 'Child Care', 'Counseling', 'Education', 'IT Support', 'Logistics', 'Translation', 'Other'];

export default function SurveyIntake() {
    const { addNeed, zones, settings } = useApp();
    const [step, setStep] = useState(0);
    const [aiLoading, setAiLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        zone: '', gps: { lat: '', lng: '' },
        category: '', severity: 5,
        description: '', title: '',
        photo: null,
    });
    const [errors, setErrors] = useState({});

    const update = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => ({ ...e, [field]: undefined }));
    };

    const validateStep = () => {
        const e = {};
        if (step === 0) {
            if (!form.zone) e.zone = 'Select a zone';
        }
        if (step === 1 && !form.category) e.category = 'Select a category';
        if (step === 3) {
            if (!form.title.trim()) e.title = 'Enter a title';
            if (!form.description.trim()) e.description = 'Enter a description';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1));
    };
    const prev = () => setStep(s => Math.max(s - 1, 0));

    const handleGPSAutofill = () => {
        update('gps', { lat: '19.076', lng: '72.877' });
    };

    const handleSubmit = async () => {
        setAiLoading(true);
        let finalCategory = form.category;
        let finalSeverity = form.severity;

        try {
            const aiResult = await autoCategorize(form.description, settings.apiKey);
            if (aiResult.confidence > 0.7) {
                finalCategory = aiResult.category;
                finalSeverity = aiResult.severity;
            }
        } catch (err) { /* keep manual values */ }

        const newNeed = {
            id: `n${Date.now()}`,
            title: form.title,
            category: finalCategory,
            severity: finalSeverity,
            zone: form.zone,
            status: 'open',
            description: form.description,
            reportedAt: new Date().toISOString(),
            assignedTo: null,
            gps: { lat: parseFloat(form.gps.lat) || 0, lng: parseFloat(form.gps.lng) || 0 },
        };

        addNeed(newNeed);
        setAiLoading(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-header-title">Survey Intake</h1>
                    <p className="page-header-subtitle">Community need reporting</p>
                </div>
                <div className="raised-card fade-up" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: 36, marginBottom: '0.5rem' }}>✓</div>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '0.5rem' }}>Need Submitted Successfully</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        AI auto-categorization has been applied. Your report is now in the needs queue.
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        setSubmitted(false);
                        setStep(0);
                        setForm({ zone: '', gps: { lat: '', lng: '' }, category: '', severity: 5, description: '', title: '', photo: null });
                    }}>
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Survey Intake</h1>
                <p className="page-header-subtitle">Community need reporting</p>
            </div>

            {/* Progress */}
            <div className="raised-card mb-lg fade-up" style={{ '--stagger': '0.05s' }}>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    {STEPS.map((s, i) => (
                        <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i <= step ? 'var(--color-teal-500)' : 'var(--color-gray-200)',
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {STEPS.map((s, i) => (
                        <span key={i} style={{
                            fontSize: 10, fontWeight: i === step ? 500 : 400,
                            color: i === step ? 'var(--color-teal-700)' : 'var(--color-text-tertiary)',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}>
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="raised-card fade-up" style={{ '--stagger': '0.1s', minHeight: 300 }}>
                {step === 0 && (
                    <div>
                        <div className="section-label mb-md">Location Details</div>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <select className="form-select" value={form.zone} onChange={e => update('zone', e.target.value)}>
                                <option value="">Select zone...</option>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                            {errors.zone && <div className="form-error">{errors.zone}</div>}
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Latitude</label>
                                <input className="form-input" type="text" value={form.gps.lat}
                                    onChange={e => update('gps', { ...form.gps, lat: e.target.value })}
                                    placeholder="19.076" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Longitude</label>
                                <input className="form-input" type="text" value={form.gps.lng}
                                    onChange={e => update('gps', { ...form.gps, lng: e.target.value })}
                                    placeholder="72.877" />
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleGPSAutofill}>
                            ◎ GPS Autofill
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <div className="section-label mb-md">Category Selection</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {CATEGORIES.map(cat => (
                                <button key={cat}
                                    className={`btn ${form.category === cat ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                    onClick={() => update('category', cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {errors.category && <div className="form-error mt-sm">{errors.category}</div>}
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <div className="section-label mb-md">Severity Assessment</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <input type="range" min="1" max="10" value={form.severity}
                                onChange={e => update('severity', parseInt(e.target.value))}
                                style={{ flex: 1, accentColor: 'var(--color-teal-500)' }}
                            />
                            <div style={{
                                width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                                background: form.severity >= 8 ? 'var(--color-coral-50)' : form.severity >= 5 ? 'var(--color-amber-50)' : 'var(--color-teal-50)',
                                color: form.severity >= 8 ? 'var(--color-coral-700)' : form.severity >= 5 ? 'var(--color-amber-700)' : 'var(--color-teal-700)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, fontWeight: 500,
                            }}>
                                {form.severity}
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                            {form.severity >= 8 ? 'Critical — Immediate response required' :
                                form.severity >= 5 ? 'Moderate — Attention needed within 24 hours' :
                                    'Low — Can be scheduled for routine response'}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className="section-label mb-md">Need Details</div>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="form-input" value={form.title}
                                onChange={e => update('title', e.target.value)}
                                placeholder="Brief title for this need..." />
                            {errors.title && <div className="form-error">{errors.title}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={form.description}
                                onChange={e => update('description', e.target.value)}
                                placeholder="Describe the situation, number of people affected, resources needed..."
                                rows={5} />
                            {errors.description && <div className="form-error">{errors.description}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Photo Upload (optional)</label>
                            <input type="file" accept="image/*" className="form-input"
                                onChange={e => update('photo', e.target.files[0])} />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div>
                        <div className="section-label mb-md">Review & Submit</div>
                        <div style={{ display: 'grid', gap: '0.5rem', fontSize: 12 }}>
                            <div className="flex justify-between" style={{ padding: '0.4rem 0', borderBottom: '0.5px solid var(--color-gray-100)' }}>
                                <span className="text-muted">Zone</span>
                                <span>{zones.find(z => z.id === form.zone)?.name || '—'}</span>
                            </div>
                            <div className="flex justify-between" style={{ padding: '0.4rem 0', borderBottom: '0.5px solid var(--color-gray-100)' }}>
                                <span className="text-muted">Category</span>
                                <span>{form.category || '—'}</span>
                            </div>
                            <div className="flex justify-between" style={{ padding: '0.4rem 0', borderBottom: '0.5px solid var(--color-gray-100)' }}>
                                <span className="text-muted">Severity</span>
                                <span className="badge badge-coral">{form.severity}/10</span>
                            </div>
                            <div className="flex justify-between" style={{ padding: '0.4rem 0', borderBottom: '0.5px solid var(--color-gray-100)' }}>
                                <span className="text-muted">Title</span>
                                <span>{form.title || '—'}</span>
                            </div>
                            <div style={{ padding: '0.4rem 0' }}>
                                <span className="text-muted">Description</span>
                                <p style={{ marginTop: 4, color: 'var(--color-text-secondary)' }}>{form.description || '—'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '0.5px solid var(--color-gray-100)' }}>
                    <button className="btn btn-secondary" onClick={prev} disabled={step === 0}
                        style={{ opacity: step === 0 ? 0.4 : 1 }}>
                        ← Previous
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button className="btn btn-primary" onClick={next}>Next →</button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={aiLoading}>
                            {aiLoading ? 'AI Processing...' : 'Submit Need'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
