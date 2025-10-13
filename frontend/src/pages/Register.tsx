import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';
import FullPageWrapper from '../components/FullPageWrapper'; // Ensure this is imported

// Get the API base URL from the environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function Register() {
	const navigate = useNavigate();

	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirm_password: '',
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
			// POST data without user_type
			const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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

			// SUCCESS: Now navigate to the role selection page, passing the token
			navigate(`/select-user-type?token=${data.token}`);

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		// 1. WRAP THE ENTIRE COMPONENT WITH FULLPAGEWRAPPER
		<FullPageWrapper title="JETSWITCH">
			<h2 style={{ marginBottom: '25px', color: '#242424' }}>Register</h2> {/* Text inside the card is black */}

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
					// Background color is white (from FullPageWrapper card)
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
				{/* Username */}
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

				{/* Email */}
				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px', textAlign: 'left' }}>
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
							padding: '10px',
							fontSize: '16px',
							borderRadius: '6px',
							border: '1px solid #ccc',
							backgroundColor: 'white',
							color: '#242424'
						}}
					/>
				</div>

				{/* Password */}
				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px', textAlign: 'left' }}>
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
							padding: '10px',
							fontSize: '16px',
							borderRadius: '6px',
							border: '1px solid #ccc',
							backgroundColor: 'white',
							color: '#242424'
						}}
					/>
				</div>

				{/* Confirm Password */}
				<div style={{ marginBottom: '20px' }}>
					<label style={{ display: 'block', marginBottom: '5px', textAlign: 'left' }}>
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
						// Ensure button styles are correct
						...{ fontFamily: 'inherit', background: loading ? '#ccc' : '#FF6C6C' }
					}}
				>
					{loading ? 'Creating Account...' : 'Register'}
				</button>
			</form>

			<p style={{ marginTop: '20px', textAlign: 'center' }}>
				Already have an account?{' '}
				<Link to="/login" style={{ color: '#FF6C6C', fontWeight: '500' }}>
					Login here
				</Link>
			</p>
		</FullPageWrapper>
	);
}
