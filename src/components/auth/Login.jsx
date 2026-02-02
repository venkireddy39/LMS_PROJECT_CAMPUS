import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError(''); // Clear error on type
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const user = await login(credentials.email, credentials.password);
            // Role based navigation suitable for Admin App
            if (user.role === 'STUDENT') {
                // Admin app might not have student dashboard, but redirecting to root or specific route
                navigate('/students');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError('Invalid credentials or server error.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: 'var(--bg-gradient)' }}>
            <div className="glass-card p-5 shadow-2xl" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="text-center mb-4">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-shield-lock-fill fs-3"></i>
                    </div>
                    <h3 className="fw-bold text-main">Welcome Back</h3>
                    <p className="text-muted small">Please sign in to access the admin dashboard.</p>
                </div>

                {error && (
                    <div className="alert alert-danger py-2 small fw-bold border-0 bg-danger bg-opacity-10 text-danger mb-4">
                        <i className="bi bi-exclamation-circle me-2"></i>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label smaller text-uppercase text-muted fw-bold">Email Address</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-envelope"></i></span>
                            <input
                                type="email"
                                name="email"
                                className="form-control border-start-0 ps-0"
                                placeholder="name@campus.com"
                                value={credentials.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="form-label smaller text-uppercase text-muted fw-bold">Password</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-key"></i></span>
                            <input
                                type="password"
                                name="password"
                                className="form-control border-start-0 ps-0"
                                placeholder="Enter your password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-premium-primary w-100 rounded-pill py-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <span className="text-muted small">Forgot password? </span>
                    <a href="#" className="text-primary fw-bold small text-decoration-none">Contact Support</a>
                </div>
            </div>

            <style>{`
                .min-vh-100 { min-height: 100vh; }
                .input-group-text { border-color: var(--border-main); }
                .input-group .form-control:focus { box-shadow: none; border-color: var(--border-main); }
                .input-group:focus-within .input-group-text,
                .input-group:focus-within .form-control { border-color: var(--primary); }
            `}</style>
        </div>
    );
};

export default Login;
