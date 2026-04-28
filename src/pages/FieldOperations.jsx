import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function FieldOperations() {
    const { needs, volunteers, zones, updateNeedStatus } = useApp();
    const [dragging, setDragging] = useState(null);
    const [drawerNeed, setDrawerNeed] = useState(null);
    const [checkedIn, setCheckedIn] = useState(new Set());

    const columns = {
        unassigned: { label: 'Unassigned', items: needs.filter(n => n.status === 'open') },
        active: { label: 'Active', items: needs.filter(n => n.status === 'active') },
        done: { label: 'Done', items: needs.filter(n => n.status === 'done') },
    };

    const handleDragStart = (needId) => setDragging(needId);
    const handleDragEnd = () => setDragging(null);

    const handleDrop = (status) => {
        if (dragging) {
            const statusMap = { unassigned: 'open', active: 'active', done: 'done' };
            updateNeedStatus(dragging, statusMap[status]);
            setDragging(null);
        }
    };

    const handleCheckIn = (needId) => {
        setCheckedIn(prev => new Set([...prev, needId]));
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-header-title">Field Operations</h1>
                <p className="page-header-subtitle">Task management and coordination</p>
            </div>

            <div className="kanban-board fade-up" style={{ '--stagger': '0.1s' }}>
                {Object.entries(columns).map(([key, col]) => (
                    <div key={key}
                        className="kanban-column"
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDrop(key)}
                    >
                        <div className="kanban-column-header">
                            <span>{col.label}</span>
                            <span className="badge badge-gray">{col.items.length}</span>
                        </div>

                        {col.items.map((need, i) => {
                            const assignee = need.assignedTo ? volunteers.find(v => v.id === need.assignedTo) : null;
                            const zone = zones.find(z => z.id === need.zone);
                            const isCheckedIn = checkedIn.has(need.id);

                            return (
                                <div key={need.id}
                                    className={`kanban-card fade-up ${dragging === need.id ? 'dragging' : ''}`}
                                    style={{ '--stagger': `${(i + 2) * 0.04}s` }}
                                    draggable
                                    onDragStart={() => handleDragStart(need.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setDrawerNeed(need)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }} className="truncate">
                                            {need.title}
                                        </span>
                                        <span className={`badge ${need.severity >= 8 ? 'badge-coral' : need.severity >= 5 ? 'badge-amber' : 'badge-teal'}`}
                                            style={{ flexShrink: 0 }}>
                                            {need.severity}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
                                        {need.category} · {zone?.name || need.zone}
                                    </div>
                                    {assignee && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 4 }}>
                                            <div style={{
                                                width: 18, height: 18, borderRadius: '50%',
                                                background: 'var(--color-teal-100)', color: 'var(--color-teal-700)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 8, fontWeight: 500,
                                            }}>
                                                {assignee.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{assignee.name}</span>
                                        </div>
                                    )}
                                    {need.status === 'active' && (
                                        <div style={{ marginTop: 6 }}>
                                            <button
                                                className={`btn btn-sm ${isCheckedIn ? 'btn-secondary' : 'btn-primary'}`}
                                                onClick={(e) => { e.stopPropagation(); handleCheckIn(need.id); }}
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >
                                                {isCheckedIn ? '✓ Checked In' : '◎ GPS Check-in'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {col.items.length === 0 && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>
                                No tasks
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Task Detail Drawer */}
            {drawerNeed && (
                <>
                    <div className="drawer-overlay" onClick={() => setDrawerNeed(null)} />
                    <div className="drawer">
                        <button className="drawer-close" onClick={() => setDrawerNeed(null)}>×</button>
                        <div style={{ marginBottom: '1rem' }}>
                            <span className={`badge ${drawerNeed.severity >= 8 ? 'badge-coral' : drawerNeed.severity >= 5 ? 'badge-amber' : 'badge-teal'}`}>
                                Severity {drawerNeed.severity}
                            </span>
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: '0.5rem' }}>{drawerNeed.title}</h2>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
                            {drawerNeed.category} · {zones.find(z => z.id === drawerNeed.zone)?.name}
                        </div>

                        <div className="section-label mt-md">Description</div>
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                            {drawerNeed.description}
                        </p>

                        <div className="section-label">Status</div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            {['open', 'active', 'done'].map(s => (
                                <button key={s}
                                    className={`btn btn-sm ${drawerNeed.status === s ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { updateNeedStatus(drawerNeed.id, s); setDrawerNeed({ ...drawerNeed, status: s }); }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {drawerNeed.assignedTo && (
                            <div>
                                <div className="section-label">Assigned To</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                    {volunteers.find(v => v.id === drawerNeed.assignedTo)?.name || 'Unknown'}
                                </div>
                            </div>
                        )}

                        <div className="section-label mt-md">GPS Location</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {drawerNeed.gps ? `${drawerNeed.gps.lat.toFixed(3)}, ${drawerNeed.gps.lng.toFixed(3)}` : 'Not available'}
                        </div>

                        <div className="section-label mt-md">Reported</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {new Date(drawerNeed.reportedAt).toLocaleString()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
