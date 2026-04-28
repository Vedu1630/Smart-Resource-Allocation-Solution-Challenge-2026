import { createContext, useContext, useReducer, useCallback } from 'react';
import { seedVolunteers, seedNeeds, seedZones, seedAlerts, seedSettings } from '../data/seed';

const AppContext = createContext(null);

const initialState = {
    volunteers: seedVolunteers,
    needs: seedNeeds,
    zones: seedZones,
    alerts: seedAlerts,
    settings: seedSettings,
    assignments: [],
};

function reducer(state, action) {
    switch (action.type) {
        case 'ADD_NEED':
            return { ...state, needs: [...state.needs, action.payload] };
        case 'UPDATE_NEED':
            return { ...state, needs: state.needs.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n) };
        case 'DELETE_NEED':
            return { ...state, needs: state.needs.filter(n => n.id !== action.payload) };
        case 'ADD_VOLUNTEER':
            return { ...state, volunteers: [...state.volunteers, action.payload] };
        case 'UPDATE_VOLUNTEER':
            return { ...state, volunteers: state.volunteers.map(v => v.id === action.payload.id ? { ...v, ...action.payload } : v) };
        case 'ASSIGN_VOLUNTEER':
            return {
                ...state,
                needs: state.needs.map(n => n.id === action.payload.needId ? { ...n, assignedTo: action.payload.volunteerId, status: 'active' } : n),
                assignments: [...state.assignments, { ...action.payload, assignedAt: new Date().toISOString() }],
            };
        case 'UPDATE_NEED_STATUS':
            return { ...state, needs: state.needs.map(n => n.id === action.payload.id ? { ...n, status: action.payload.status } : n) };
        case 'ACKNOWLEDGE_ALERT':
            return { ...state, alerts: state.alerts.map(a => a.id === action.payload ? { ...a, acknowledged: true } : a) };
        case 'ADD_ALERT':
            return { ...state, alerts: [...state.alerts, action.payload] };
        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.payload } };
        case 'MERGE_NEEDS':
            return { ...state, needs: [...state.needs, ...action.payload] };
        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const addNeed = useCallback((need) => dispatch({ type: 'ADD_NEED', payload: need }), []);
    const updateNeed = useCallback((need) => dispatch({ type: 'UPDATE_NEED', payload: need }), []);
    const deleteNeed = useCallback((id) => dispatch({ type: 'DELETE_NEED', payload: id }), []);
    const addVolunteer = useCallback((v) => dispatch({ type: 'ADD_VOLUNTEER', payload: v }), []);
    const updateVolunteer = useCallback((v) => dispatch({ type: 'UPDATE_VOLUNTEER', payload: v }), []);
    const assignVolunteer = useCallback((needId, volunteerId) => dispatch({ type: 'ASSIGN_VOLUNTEER', payload: { needId, volunteerId } }), []);
    const updateNeedStatus = useCallback((id, status) => dispatch({ type: 'UPDATE_NEED_STATUS', payload: { id, status } }), []);
    const acknowledgeAlert = useCallback((id) => dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: id }), []);
    const addAlert = useCallback((alert) => dispatch({ type: 'ADD_ALERT', payload: alert }), []);
    const updateSettings = useCallback((s) => dispatch({ type: 'UPDATE_SETTINGS', payload: s }), []);
    const mergeNeeds = useCallback((needs) => dispatch({ type: 'MERGE_NEEDS', payload: needs }), []);

    return (
        <AppContext.Provider value={{
            ...state,
            addNeed, updateNeed, deleteNeed,
            addVolunteer, updateVolunteer,
            assignVolunteer, updateNeedStatus,
            acknowledgeAlert, addAlert,
            updateSettings, mergeNeeds,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
