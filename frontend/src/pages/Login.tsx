import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import FullPageWrapper from '../components/FullPageWrapper';

// Get the API base URL from the environment
const API_BASE_URL = window.__APP_CONFIG__?.API_BASE_URL || "http://localhost:8080";

export default function Login() {
	const navigate = useNavigate();
	const { login } = useAuth();

	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
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
			// Redirect to Landing Page ('/') instead of Home ('/home')
			navigate('/', { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<FullPageWrapper title="JetSwitch">
			<h2 className="mb-6 text-[#242424]">Login</h2>

			{error && (
				<div className="text-red-500 p-2.5 mb-4 border border-red-500 rounded">{error}</div>
			)}

			<div className="mb-5">
				<GoogleLoginButton />
			</div>

			<div className="text-center my-5 text-[#888] relative">
				<span className="bg-white px-2.5 relative z-10">OR</span>
				<div className="absolute top-1/2 left-0 right-0 h-px bg-[#ccc] z-0" />
			</div>

			<form onSubmit={handleSubmit}>
				<div className="form-group">
					<label className="form-label">Username:</label>
					<input
						type="text"
						name="username"
						value={formData.username}
						onChange={handleChange}
						required
						className="form-input"
					/>
				</div>

				<div className="form-group mb-5">
					<label className="form-label">Password:</label>
					<input
						type="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						required
						className="form-input"
					/>
				</div>

				<button type="submit" disabled={loading} className="btn-primary">
					{loading ? 'Logging in...' : 'Login'}
				</button>
			</form>

			<p className="mt-5 text-center">
				No account?{' '}
				<Link to="/register" className="link-primary">
					Register here
				</Link>
			</p>
		</FullPageWrapper>
	);
}
