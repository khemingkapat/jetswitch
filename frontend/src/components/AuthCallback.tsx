import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [searchParams] = useSearchParams();

	useEffect(() => {
		const token = searchParams.get('token');

		if (token) {
			// Decode JWT to get user info (simple decode, not verification)
			try {
				const base64Url = token.split('.')[1];
				const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
				const payload = JSON.parse(window.atob(base64));

				// Fetch full user data from backend
				fetch('http://localhost:8080/api/auth/me', {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
					.then(res => res.json())
					.then(data => {
						login(token, data.user);
						navigate('/');
					})
					.catch(() => {
						// If fetch fails, still log in with basic info
						login(token, {
							id: payload.user_id,
							username: payload.username,
							email: '',
							user_type: 'listener',
							auth_provider: 'google'
						});
						navigate('/');
					});
			} catch (error) {
				console.error('Failed to process token:', error);
				navigate('/login');
			}
		} else {
			navigate('/login');
		}
	}, [searchParams, login, navigate]);

	return (
		<div style={{ textAlign: 'center', marginTop: '100px' }}>
			<h2>Processing login...</h2>
			<p>Please wait while we complete your authentication.</p>
		</div>
	);
}
