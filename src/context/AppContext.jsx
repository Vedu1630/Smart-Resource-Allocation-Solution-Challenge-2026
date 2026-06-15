import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { seedVolunteers, seedNeeds, seedZones, seedAlerts, seedSettings } from '../data/seed';
import { API_BASE_URL } from '../config';

const AppContext = createContext(null);
const API_URL = `${API_BASE_URL}/api`;

// Create socket connection outside component so it doesn't reconnect on every render
const socket = io(API_BASE_URL);

const initialState = {
    volunteers: [],
    needs: [],
    zones: [],
    alerts: seedAlerts, // keep alerts local for now
    settings: seedSettings,
    assignments: [],
    loading: true,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                needs: action.payload.needs,
                volunteers: action.payload.volunteers,
                zones: action.payload.zones,
                loading: false
            };
        case 'ADD_NEED':
            // Check if it already exists (to avoid duplicate from our own socket event)
            if (state.needs.find(n => n.id === action.payload.id)) return state;
            return { ...state, needs: [...state.needs, action.payload] };
        case 'UPDATE_NEED':
            return { ...state, needs: state.needs.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n) };
        case 'DELETE_NEED':
            return { ...state, needs: state.needs.filter(n => n.id !== action.payload) };
        case 'ADD_VOLUNTEER':
            if (state.volunteers.find(v => v.id === action.payload.id)) return state;
            return { ...state, volunteers: [...state.volunteers, action.payload] };
        case 'UPDATE_VOLUNTEER':
            return { ...state, volunteers: state.volunteers.map(v => v.id === action.payload.id ? { ...v, ...action.payload } : v) };
        
        // Keep local-only state operations for alerts and settings
        case 'ACKNOWLEDGE_ALERT':
            return { ...state, alerts: state.alerts.map(a => a.id === action.payload ? { ...a, acknowledged: true } : a) };
        case 'ADD_ALERT':
            return { ...state, alerts: [...state.alerts, action.payload] };
        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.payload } };
        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Initial Data Fetch & Sockets
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [needsRes, volsRes, zonesRes] = await Promise.all([
                    fetch(`${API_URL}/needs`),
                    fetch(`${API_URL}/volunteers`),
                    fetch(`${API_URL}/zones`)
                ]);
                
                let needs = await needsRes.json();
                let volunteers = await volsRes.json();
                let zones = await zonesRes.json();

                // Auto-seed if database is empty!
                if (needs.length === 0 && volunteers.length === 0) {
                    console.log('Database empty, auto-seeding data...');
                    // Fire and forget POST requests to seed the backend
                    seedNeeds.forEach(n => fetch(`${API_URL}/needs`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(n) }));
                    seedVolunteers.forEach(v => fetch(`${API_URL}/volunteers`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(v) }));
                    
                    needs = seedNeeds;
                    volunteers = seedVolunteers;
                    zones = seedZones;
                }

                dispatch({ type: 'SET_INITIAL_DATA', payload: { needs, volunteers, zones: zones.length ? zones : seedZones } });
            } catch (err) {
                console.error('Failed to fetch data from backend, falling back to mock data', err);
                dispatch({ type: 'SET_INITIAL_DATA', payload: { needs: seedNeeds, volunteers: seedVolunteers, zones: seedZones } });
            }
        };

        fetchInitialData();

        // Socket.io Listeners (Listen for real-time changes made by OTHER users)
        socket.on('need_added', (need) => {
            dispatch({ type: 'ADD_NEED', payload: need });
        });
        
        socket.on('need_updated', (updatedNeed) => {
            dispatch({ type: 'UPDATE_NEED', payload: updatedNeed });
        });
        
        socket.on('volunteer_added', (volunteer) => {
            dispatch({ type: 'ADD_VOLUNTEER', payload: volunteer });
        });

        socket.on('volunteer_updated', (updatedVolunteer) => {
            dispatch({ type: 'UPDATE_VOLUNTEER', payload: updatedVolunteer });
        });

        return () => {
            socket.off('need_added');
            socket.off('need_updated');
            socket.off('volunteer_added');
            socket.off('volunteer_updated');
        };
    }, []);

    // Actions that now push to backend Database
    const addNeed = useCallback(async (need) => {
        try {
            await fetch(`${API_URL}/needs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(need)
            });
            // We don't need to manually dispatch ADD_NEED here, because the backend will emit 'need_added' 
            // via Socket.io and our listener above will catch it! But for instant UI, we can do it optimistically:
            dispatch({ type: 'ADD_NEED', payload: need });
        } catch (err) {
            console.error('Failed to add need:', err);
        }
    }, []);

    const updateNeedStatus = useCallback(async (id, status) => {
        try {
            await fetch(`${API_URL}/needs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            dispatch({ type: 'UPDATE_NEED', payload: { id, status } });
        } catch (err) { console.error(err); }
    }, []);

    const assignVolunteer = useCallback(async (needId, volunteerId) => {
        try {
            await fetch(`${API_URL}/needs/${needId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedTo: volunteerId, status: 'active' })
            });
            dispatch({ type: 'UPDATE_NEED', payload: { id: needId, assignedTo: volunteerId, status: 'active' } });
        } catch (err) { console.error(err); }
    }, []);


    // Local only actions
    const acknowledgeAlert = useCallback((id) => dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: id }), []);
    const addAlert = useCallback((alert) => dispatch({ type: 'ADD_ALERT', payload: alert }), []);
    const updateSettings = useCallback((s) => dispatch({ type: 'UPDATE_SETTINGS', payload: s }), []);

    // Mock unimplemented functions to prevent errors
    const deleteNeed = useCallback((id) => dispatch({ type: 'DELETE_NEED', payload: id }), []);
    const addVolunteer = useCallback(async (v) => {
        try {
            await fetch(`${API_URL}/volunteers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(v)
            });
            dispatch({ type: 'ADD_VOLUNTEER', payload: v });
        } catch (err) {
            console.error('Failed to add volunteer:', err);
        }
    }, []);
    const updateVolunteer = useCallback(async (v) => {
        try {
            await fetch(`${API_URL}/volunteers/${v.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(v)
            });
            dispatch({ type: 'UPDATE_VOLUNTEER', payload: v });
        } catch (err) {
            console.error('Failed to update volunteer:', err);
        }
    }, []);

    return (
        <AppContext.Provider value={{
            ...state,
            addNeed, updateNeedStatus, assignVolunteer,
            deleteNeed, addVolunteer, updateVolunteer,
            acknowledgeAlert, addAlert, updateSettings
        }}>
            {!state.loading && children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
