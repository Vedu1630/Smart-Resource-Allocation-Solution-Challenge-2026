import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MyMissions() {
    const { currentUser } = useAuth();
    const { volunteers, needs, zones, updateVolunteer, updateNeedStatus, addVolunteer } = useApp();
    const [selectedNeed, setSelectedNeed] = useState(null);

    // Look up the volunteer profile associated with this logged-in user
    const volunteer = volunteers.find(v => v.email?.toLowerCase() === currentUser?.email?.toLowerCase());

    // Auto-create volunteer record in DB if it doesn't exist yet (for newly signed up users)
    useEffect(() => {
        if (currentUser && !volunteer && volunteers.length > 0) {
            const newVol = {
                id: `v_${Date.now()}`,
                name: currentUser.name,
                email: currentUser.email,
                phone: '',
                skills: ['General Support'],
                languages: ['English'],
                availability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
                zone: 'z1',
                status: 'active',
                hoursLogged: 0,
                matchHistory: [],
                joinDate: new Date().toISOString().split('T')[0],
                gps: { lat: 19.076, lng: 72.877 },
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            };
            addVolunteer(newVol);
        }
    }, [currentUser, volunteer, volunteers, addVolunteer]);

    // Get needs assigned to this volunteer
    const myMissions = volunteer ? needs.filter(n => n.assignedTo === volunteer.id) : [];
    const activeMissions = myMissions.filter(n => n.status === 'active');
    const resolvedMissions = myMissions.filter(n => n.status === 'done');
    const pendingMissions = myMissions.filter(n => n.status === 'open');

    const handleToggleAvailability = (day) => {
        if (!volunteer) return;
        const currentAvail = volunteer.availability || {};
        updateVolunteer({
            id: volunteer.id,
            availability: { ...currentAvail, [day]: !currentAvail[day] }
        });
    };

    const handleStatusUpdate = (needId, status) => {
        updateNeedStatus(needId, status);
        // If updating a volunteer's hours on resolution
        if (status === 'done' && volunteer) {
            const hoursGained = 4; // simulated average hours per mission
            updateVolunteer({
                id: volunteer.id,
                hoursLogged: (volunteer.hoursLogged || 0) + hoursGained,
                matchHistory: [...(volunteer.matchHistory || []), needId]
            });
        }
    };

    if (!volunteer) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="skeleton skeleton-text" style={{ width: '40%', margin: '0 auto 1rem' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '80%', margin: '0 auto 2rem' }}></div>
                <div className="raised-card" style={{ padding: '3rem' }}>
                    <h3>Initializing Volunteer Profile...</h3>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                        Creating your dispatcher roster entry in the SQLite database.
                    </p>
                </div>
            </div>
        );
    }

    const currentZoneName = zones.find(z => z.id === volunteer.zone)?.name || volunteer.zone || 'North District';

    return (
        <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header section with glassmorphism styling */}
            <div className="fade-up" style={{
                background: 'linear-gradient(135deg, var(--color-teal-600) 0%, var(--color-blue-700) 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 2 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                        {volunteer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Active Responder
                        </div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{volunteer.name}</h2>
                        <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                            📍 Assigned Zone: {currentZoneName}
                        </div>
                    </div>
                </div>
                <div style={{
                    position: 'absolute', right: -20, bottom: -20,
                    fontSize: 120, opacity: 0.08, pointerEvents: 'none', userSelect: 'none'
                }}>
                    ◆
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid-3 mb-md fade-up" style={{ '--stagger': '0.05s' }}>
                <div className="metric-card" style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <div className="metric-card-label" style={{ fontSize: 9 }}>Hours Logged</div>
                    <div className="metric-card-value" style={{ fontSize: 20 }}>{Math.round(volunteer.hoursLogged || 0)}h</div>
                </div>
                <div className="metric-card" style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <div className="metric-card-label" style={{ fontSize: 9 }}>Active Missions</div>
                    <div className="metric-card-value" style={{ fontSize: 20, color: activeMissions.length > 0 ? 'var(--color-amber-600)' : 'inherit' }}>
                        {activeMissions.length}
                    </div>
                </div>
                <div className="metric-card" style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <div className="metric-card-label" style={{ fontSize: 9 }}>Resolved</div>
                    <div className="metric-card-value" style={{ fontSize: 20, color: 'var(--color-teal-600)' }}>{resolvedMissions.length}</div>
                </div>
            </div>

            {/* Availability Check row */}
            <div className="raised-card mb-md fade-up" style={{ '--stagger': '0.1s' }}>
                <div className="section-label" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Duty Availability</span>
                    <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>Tap days you can serve</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                    {DAYS.map((d, i) => {
                        const isAvail = volunteer.availability?.[d];
                        return (
                            <div key={d} style={{ textAlign: 'center', flex: 1 }} onClick={() => handleToggleAvailability(d)}>
                                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{DAY_LABELS[i]}</div>
                                <div style={{
                                    height: 32,
                                    borderRadius: 'var(--radius-sm)',
                                    background: isAvail ? 'var(--color-teal-500)' : 'var(--color-gray-100)',
                                    color: isAvail ? 'white' : 'var(--color-text-tertiary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 500, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    boxShadow: isAvail ? '0 2px 4px rgba(20, 184, 166, 0.2)' : 'none',
                                    border: isAvail ? 'none' : '0.5px solid var(--color-border-tertiary)'
                                }}>
                                    {isAvail ? 'ON' : 'OFF'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Missions List */}
            <div className="raised-card fade-up" style={{ '--stagger': '0.15s' }}>
                <div className="section-label" style={{ marginBottom: '0.75rem' }}>Assigned Missions</div>

                {myMissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-tertiary)' }}>
                        <div style={{ fontSize: 24, marginBottom: '0.5rem' }}>💤</div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>No missions assigned right now</div>
                        <p style={{ fontSize: 10, marginTop: 4 }}>
                            Managers will allocate needs in your district as they are reported. Check back soon!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {myMissions.map((need) => {
                            const isSelected = selectedNeed === need.id;
                            return (
                                <div key={need.id} style={{
                                    border: isSelected ? '1.5px solid var(--color-gray-900)' : '0.5px solid var(--color-border-tertiary)',
                                    background: isSelected ? 'var(--color-gray-50)' : 'var(--color-gray-50)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }} onClick={() => setSelectedNeed(isSelected ? null : need.id)}>
                                    
                                    {/* Main info row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 500,
                                                    background: need.severity >= 8 ? 'var(--color-coral-100)' : need.severity >= 6 ? 'var(--color-amber-100)' : 'var(--color-teal-100)',
                                                    color: need.severity >= 8 ? 'var(--color-coral-700)' : need.severity >= 6 ? 'var(--color-amber-700)' : 'var(--color-teal-700)',
                                                }}>
                                                    Severity: {need.severity}
                                                </span>
                                                <span className="tag" style={{ margin: 0, fontSize: 9 }}>{need.category}</span>
                                            </div>
                                            <h4 style={{ margin: '6px 0 2px 0', fontSize: 13, fontWeight: 500 }}>{need.title}</h4>
                                            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)', display: isSelected ? 'block' : 'none' }}>
                                                {need.description}
                                            </p>
                                        </div>
                                        <span className={`badge ${need.status === 'done' ? 'badge-teal' : need.status === 'active' ? 'badge-amber' : 'badge-coral'}`} style={{ fontSize: 9 }}>
                                            {need.status === 'done' ? 'resolved' : need.status}
                                        </span>
                                    </div>

                                    {/* Action drawer when card is clicked */}
                                    {isSelected && (
                                        <div className="fade-up" style={{
                                            marginTop: '1rem',
                                            borderTop: '0.5px solid var(--color-border-tertiary)',
                                            paddingTop: '0.75rem',
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: '0.5rem'
                                        }} onClick={e => e.stopPropagation()}>
                                            {need.status === 'open' && (
                                                <button className="btn btn-secondary btn-sm" style={{ fontSize: 10 }}
                                                    onClick={() => handleStatusUpdate(need.id, 'active')}>
                                                    Accept Mission
                                                </button>
                                            )}
                                            {need.status === 'active' && (
                                                <>
                                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 10 }}
                                                        onClick={() => handleStatusUpdate(need.id, 'open')}>
                                                        Release / Decline
                                                    </button>
                                                    <button className="btn btn-primary btn-sm" style={{ fontSize: 10, background: 'var(--color-teal-600)', borderColor: 'var(--color-teal-600)' }}
                                                        onClick={() => handleStatusUpdate(need.id, 'done')}>
                                                        Mark Completed ✓
                                                    </button>
                                                </>
                                            )}
                                            {need.status === 'done' && (
                                                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', alignSelf: 'center' }}>
                                                    Mission resolved and verified. Thanks!
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
