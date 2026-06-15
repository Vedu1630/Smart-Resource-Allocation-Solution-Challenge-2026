import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('volunteer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signup } = useAuth();
    const navigate = useNavigate();

    const validatePassword = (pass) => {
        if (pass.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(pass)) return 'Password must contain an uppercase letter.';
        if (!/[0-9]/.test(pass)) return 'Password must contain a number.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name || !email || !password || !confirmPassword) {
            return setError('Please fill in all fields.');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return setError(passwordError);
        }

        try {
            setError('');
            setLoading(true);
            const user = await signup(email, password, name, role);
            if (user.role === 'manager') {
                navigate('/', { replace: true });
            } else {
                navigate('/missions', { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Failed to create an account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join ImpactMatch to coordinate volunteer efforts.</p>
                </div>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                            type="email" 
                            className="form-input" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select 
                            className="form-select" 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        >
                            <option value="volunteer">Volunteer</option>
                            <option value="manager">Manager / Coordinator</option>
                        </select>
                    </div>
                    
                    <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Log In</Link>
                </div>
            </div>
        </div>
    );
}
