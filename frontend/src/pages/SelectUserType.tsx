import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageWrapper from '../components/FullPageWrapper';

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
			// Redirect to Landing Page ('/') instead of Home ('/home')
			navigate('/', { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to finalize registration.');
		} finally {
			setLoading(false);
		}
	};

	if (!token) {
		return (
			<FullPageWrapper useCard={false}>
				<div style={{ textAlign: 'center', color: 'white' }}>
					<h2>Error</h2>
					<p>No authentication token found. Please try logging in again.</p>
					<button
						onClick={() => navigate('/login')}
						style={{
							marginTop: '20px',
							padding: '10px 20px',
							borderRadius: '8px',
							border: 'none',
							cursor: 'pointer'
						}}
					>
						Go to Login
					</button>
				</div>
			</FullPageWrapper>
		);
	}

	return (
		<FullPageWrapper useCard={false}>
			<div style={{
				width: '100%',
				maxWidth: '550px',
				padding: '40px',
				backgroundColor: 'rgba(255, 255, 255, 0.1)',
				backdropFilter: 'blur(10px)',
				borderRadius: '12px',
				boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
				color: 'white'
			}}>
				<h2 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '2.5em', fontWeight: 'bold' }}>JETSWITCH</h2>
				<h3 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.5em' }}>
					What best describes you?
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
					flexDirection: 'column',
					gap: '20px',
					justifyContent: 'center'
				}}>
					{/* Listener Card */}
					<div
						onClick={() => setUserType('listener')}
						style={{
							padding: '20px',
							border: `2px solid ${userType === 'listener' ? '#fff' : 'transparent'}`,
							borderRadius: '12px',
							cursor: 'pointer',
							backgroundColor: userType === 'listener' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
							transition: 'all 0.3s',
							textAlign: 'center'
						}}
					>
						<h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '1.2em' }}>🎧 Listener</h3>
						<p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
							I want to discover new music and find songs similar to my favorites.
						</p>
					</div>

					{/* Artist Card */}
					<div
						onClick={() => setUserType('artist')}
						style={{
							padding: '20px',
							border: `2px solid ${userType === 'artist' ? '#fff' : 'transparent'}`,
							borderRadius: '12px',
							cursor: 'pointer',
							backgroundColor: userType === 'artist' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
							transition: 'all 0.3s',
							textAlign: 'center'
						}}
					>
						<h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '1.2em' }}>🎤 Artist</h3>
						<p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
							I create music and want to upload my tracks and find collaborators.
						</p>
					</div>
				</div>

				<button
					onClick={handleSubmit}
					disabled={loading}
					style={{
						width: '100%',
						padding: '14px',
						fontSize: '16px',
						backgroundColor: loading ? '#ccc' : 'white',
						color: loading ? '#666' : '#FF6C6C',
						border: 'none',
						borderRadius: '8px',
						cursor: loading ? 'not-allowed' : 'pointer',
						fontWeight: 'bold',
						transition: 'transform 0.1s',
					}}
				>
					{loading ? 'Continuing...' : 'Continue'}
				</button>
			</div>
		</FullPageWrapper>
	);
}
