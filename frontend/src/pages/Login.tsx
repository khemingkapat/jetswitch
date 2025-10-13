import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import FullPageWrapper from '../components/FullPageWrapper';

// Get the API base URL from the environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function Login() {
	const navigate = useNavigate();
	const { login } = useAuth();

	const [formData, setFormData] = useState({
		username: '',
		password: ''
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Login failed');
			}

			login(data.token, data.user);
			navigate('/'); // Redirect to the temporary home route
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<FullPageWrapper title="JETSWITCH">
			<h2 style={{ marginBottom: '25px', color: '#242424' }}>Login</h2>

			{error && (
				<div style={{
					color: 'red',
					padding: '10px',
					marginBottom: '15px',
					border: '1px solid red',
					borderRadius: '4px'
				}}>
					{error}
				</div>
			)}

			{/* Google Login Button */}
			<div style={{ marginBottom: '20px' }}>
				<GoogleLoginButton />
			</div>

			<div style={{
				textAlign: 'center',
				margin: '20px 0',
				color: '#888',
				position: 'relative'
			}}>
				<span style={{
					// Background is white from the wrapper, text is black/grey
					backgroundColor: 'white',
					padding: '0 10px',
					position: 'relative',
					zIndex: 1
				}}>
					OR
				</span>
				<div style={{
					position: 'absolute',
					top: '50%',
					left: 0,
					right: 0,
					height: '1px',
					backgroundColor: '#ccc',
					zIndex: 0
				}} />
			</div>

			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px', textAlign: 'left' }}>
						Username:
					</label>
					<input
						type="text"
						name="username"
						value={formData.username}
						onChange={handleChange}
						required
						style={{
							width: '100%',
							padding: '10px',
							fontSize: '16px',
							borderRadius: '6px',
							border: '1px solid #ccc',
							backgroundColor: 'white',
							color: '#242424'
						}}

					/>
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{ display: 'block', marginBottom: '5px', textAlign: 'left' }}>
						Password:
					</label>
					<input
						type="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						required
						style={{
							width: '100%',
							padding: '10px',
							fontSize: '16px',
							borderRadius: '6px',
							border: '1px solid #ccc',
							backgroundColor: 'white',
							color: '#242424'
						}}
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					style={{
						width: '100%',
						padding: '12px',
						fontSize: '16px',
						backgroundColor: loading ? '#ccc' : '#FF6C6C',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						cursor: loading ? 'not-allowed' : 'pointer',
						fontWeight: '600',
						...{ fontFamily: 'inherit', background: loading ? '#ccc' : '#FF6C6C' }
					}}
				>
					{loading ? 'Logging in...' : 'Login'}
				</button>
			</form>

			<p style={{ marginTop: '20px', textAlign: 'center' }}>
				No account?{' '}
				<Link to="/register" style={{ color: '#FF6C6C', fontWeight: '500' }}>
					Register here
				</Link>
			</p>
		</FullPageWrapper>
	);
}

