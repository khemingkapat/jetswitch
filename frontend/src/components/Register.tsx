import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';

export default function Register() {
	const navigate = useNavigate();
	const { login } = useAuth();

	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirm_password: '',
		user_type: 'listener'
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
			const response = await fetch('http://localhost:8080/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Registration failed');
			}

			login(data.token, data.user);
			navigate('/');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
			<h2>Create Account</h2>

			{error && (
				<div style={{
					color: 'red',
					padding: '10px',
					marginBottom: '10px',
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
					backgroundColor: '#242424',
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
					backgroundColor: '#444',
					zIndex: 0
				}} />
			</div>

			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px' }}>
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
							padding: '8px',
							fontSize: '16px',
							borderRadius: '4px',
							border: '1px solid #ccc'
						}}
					/>
				</div>

				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px' }}>
						Email:
					</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						required
						style={{
							width: '100%',
							padding: '8px',
							fontSize: '16px',
							borderRadius: '4px',
							border: '1px solid #ccc'
						}}
					/>
				</div>

				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px' }}>
						Password:
					</label>
					<input
						type="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						required
						minLength={6}
						style={{
							width: '100%',
							padding: '8px',
							fontSize: '16px',
							borderRadius: '4px',
							border: '1px solid #ccc'
						}}
					/>
				</div>

				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px' }}>
						Confirm Password:
					</label>
					<input
						type="password"
						name="confirm_password"
						value={formData.confirm_password}
						onChange={handleChange}
						required
						minLength={6}
						style={{
							width: '100%',
							padding: '8px',
							fontSize: '16px',
							borderRadius: '4px',
							border: '1px solid #ccc'
						}}
					/>
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{ display: 'block', marginBottom: '5px' }}>
						I am a:
					</label>
					<select
						name="user_type"
						value={formData.user_type}
						onChange={handleChange}
						style={{
							width: '100%',
							padding: '8px',
							fontSize: '16px',
							borderRadius: '4px',
							border: '1px solid #ccc'
						}}
					>
						<option value="listener">Listener</option>
						<option value="artist">Artist</option>
					</select>
				</div>

				<button
					type="submit"
					disabled={loading}
					style={{
						width: '100%',
						padding: '10px',
						fontSize: '16px',
						backgroundColor: loading ? '#ccc' : '#646cff',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: loading ? 'not-allowed' : 'pointer'
					}}
				>
					{loading ? 'Creating Account...' : 'Create Account'}
				</button>
			</form>

			<p style={{ marginTop: '20px', textAlign: 'center' }}>
				Already have an account?{' '}
				<a href="/login" style={{ color: '#646cff' }}>
					Login here
				</a>
			</p>
		</div>
	);
}
