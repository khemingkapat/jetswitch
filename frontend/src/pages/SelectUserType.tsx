import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Get the API base URL from the environment (defaulting to localhost for local testing)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function SelectUserType() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [searchParams] = useSearchParams();
	const [userType, setUserType] = useState<'listener' | 'artist'>('listener');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const token = searchParams.get('token');

	const handleSubmit = async () => {
		if (!token) {
			setError('No authentication token found.');
			return;
		}

		setLoading(true);
		setError('');

		try {
			// 1. Decode token to get user ID
			const parts = token.split('.');
			if (parts.length < 2) {
				throw new Error('Invalid token format');
			}
			const base64Url = parts[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const payload = JSON.parse(window.atob(base64));

			// 2. Update user type via the backend API
			const response = await fetch(`${API_BASE_URL}/api/auth/update-user-type`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					user_id: payload.user_id, // Use ID from token payload
					user_type: userType
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update user type on backend.');
			}

			// 3. Fetch full user data and log in
			const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			const userData = await userResponse.json();

			if (!userResponse.ok) {
				throw new Error('Failed to fetch user data after role selection.');
			}

			// Log in with updated user type
			login(token, userData.user);
			navigate('/home', { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to finalize registration.');
		} finally {
			setLoading(false);
		}
	};

	if (!token) {
		return (
			<div style={{ textAlign: 'center', marginTop: '100px', color: 'white' }}>
				<h2>Error</h2>
				<p>No authentication token found. Please try logging in again.</p>
				<button onClick={() => navigate('/login')}>Go to Login</button>
			</div>
		);
	}

	return (
		<div style={{
			// Apply gradient background similar to design
			background: 'linear-gradient(180deg, #ff6c6c 0%, #ff8c4a 100%)',
			maxWidth: '550px',
			margin: '100px auto',
			padding: '40px',
			borderRadius: '12px',
			boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
			color: 'white'
		}}>
			<h2 style={{ textAlign: 'center', marginBottom: '15px' }}>JETSWITCH</h2>
			<h3 style={{ textAlign: 'center', marginBottom: '30px' }}>
				What best describe you?
			</h3>

			{error && (
				<div style={{
					color: 'white',
					padding: '10px',
					marginBottom: '20px',
					border: '1px solid white',
					borderRadius: '4px',
					textAlign: 'center',
					backgroundColor: 'rgba(255, 0, 0, 0.2)'
				}}>
					{error}
				</div>
			)}

			<div style={{
				marginBottom: '30px',
				display: 'flex',
				gap: '20px',
				justifyContent: 'center'
			}}>
				{/* Listener Card */}
				<div
					onClick={() => setUserType('listener')}
					style={{
						padding: '20px',
						flex: 1,
						border: `2px solid ${userType === 'listener' ? '#2196F3' : '#fff'}`,
						borderRadius: '12px',
						cursor: 'pointer',
						backgroundColor: userType === 'listener' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(0, 0, 0, 0.2)',
						transition: 'all 0.3s',
						textAlign: 'center'
					}}
				>
					<h3 style={{ margin: '0 0 10px 0', color: 'white' }}>🎧 Listener</h3>
					<p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
						I want to discover new music and find songs similar to my favorites.
					</p>
				</div>

				{/* Artist Card */}
				<div
					onClick={() => setUserType('artist')}
					style={{
						padding: '20px',
						flex: 1,
						border: `2px solid ${userType === 'artist' ? '#2196F3' : '#fff'}`,
						borderRadius: '12px',
						cursor: 'pointer',
						backgroundColor: userType === 'artist' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(0, 0, 0, 0.2)',
						transition: 'all 0.3s',
						textAlign: 'center'
					}}
				>
					<h3 style={{ margin: '0 0 10px 0', color: 'white' }}>🎤 Artist</h3>
					<p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
						I create music and want to upload my tracks and find collaborators.
					</p>
				</div>
			</div>

			<button
				onClick={handleSubmit}
				disabled={loading}
				style={{
					width: '100%',
					padding: '12px',
					fontSize: '16px',
					backgroundColor: loading ? '#ccc' : '#2196F3',
					color: 'white',
					border: 'none',
					borderRadius: '6px',
					cursor: loading ? 'not-allowed' : 'pointer',
					fontWeight: '600'
				}}
			>
				{loading ? 'Continuing...' : 'Continue'}
			</button>
		</div>
	);
}

