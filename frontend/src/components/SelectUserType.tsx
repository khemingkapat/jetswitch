import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
			setError('No authentication token found');
			return;
		}

		setLoading(true);
		setError('');

		try {
			// Decode token to get user ID
			const base64Url = token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const payload = JSON.parse(window.atob(base64));

			// Update user type
			const response = await fetch('http://localhost:8080/api/auth/update-user-type', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					user_id: payload.user_id,
					user_type: userType
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update user type');
			}

			// Log in with updated user type
			login(token, {
				id: payload.user_id,
				username: payload.username,
				email: '',
				user_type: userType,
				auth_provider: 'google'
			});

			navigate('/');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update user type');
		} finally {
			setLoading(false);
		}
	};

	if (!token) {
		return (
			<div style={{ textAlign: 'center', marginTop: '100px' }}>
				<h2>Error</h2>
				<p>No authentication token found. Please try logging in again.</p>
				<button onClick={() => navigate('/login')}>Go to Login</button>
			</div>
		);
	}

	return (
		<div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
			<h2 style={{ textAlign: 'center' }}>Welcome to JetSwitch!</h2>
			<p style={{ textAlign: 'center', marginBottom: '30px' }}>
				Before we continue, please tell us who you are:
			</p>

			{error && (
				<div style={{
					color: 'red',
					padding: '10px',
					marginBottom: '20px',
					border: '1px solid red',
					borderRadius: '4px',
					textAlign: 'center'
				}}>
					{error}
				</div>
			)}

			<div style={{ marginBottom: '30px' }}>
				<div
					onClick={() => setUserType('listener')}
					style={{
						padding: '20px',
						marginBottom: '15px',
						border: `2px solid ${userType === 'listener' ? '#646cff' : '#444'}`,
						borderRadius: '8px',
						cursor: 'pointer',
						backgroundColor: userType === 'listener' ? 'rgba(100, 108, 255, 0.1)' : 'transparent',
						transition: 'all 0.3s'
					}}
				>
					<h3 style={{ margin: '0 0 10px 0' }}>🎧 Listener</h3>
					<p style={{ margin: 0, color: '#888' }}>
						I want to discover new music and find songs similar to my favorites
					</p>
				</div>

				<div
					onClick={() => setUserType('artist')}
					style={{
						padding: '20px',
						border: `2px solid ${userType === 'artist' ? '#646cff' : '#444'}`,
						borderRadius: '8px',
						cursor: 'pointer',
						backgroundColor: userType === 'artist' ? 'rgba(100, 108, 255, 0.1)' : 'transparent',
						transition: 'all 0.3s'
					}}
				>
					<h3 style={{ margin: '0 0 10px 0' }}>🎤 Artist</h3>
					<p style={{ margin: 0, color: '#888' }}>
						I create music and want to upload my tracks and find collaborators
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
					backgroundColor: loading ? '#ccc' : '#646cff',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: loading ? 'not-allowed' : 'pointer',
					fontWeight: '500'
				}}
			>
				{loading ? 'Saving...' : 'Continue'}
			</button>
		</div>
	);
}
