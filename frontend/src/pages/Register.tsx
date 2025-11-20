import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';
import FullPageWrapper from '../components/FullPageWrapper';

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
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
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

			navigate(`/select-user-type?token=${data.token}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<FullPageWrapper title="JETSWITCH">
			<h2 className="mb-6 text-[#242424]">Register</h2>

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

				<div className="form-group">
					<label className="form-label">Email:</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						required
						className="form-input"
					/>
				</div>

				<div className="form-group">
					<label className="form-label">Password:</label>
					<input
						type="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						required
						minLength={6}
						className="form-input"
					/>
				</div>

				<div className="form-group mb-5">
					<label className="form-label">Confirm Password:</label>
					<input
						type="password"
						name="confirm_password"
						value={formData.confirm_password}
						onChange={handleChange}
						required
						minLength={6}
						className="form-input"
					/>
				</div>

				<button type="submit" disabled={loading} className="btn-primary">
					{loading ? 'Creating Account...' : 'Register'}
				</button>
			</form>

			<p className="mt-5 text-center">
				Already have an account?{' '}
				<Link to="/login" className="link-primary">
					Login here
				</Link>
			</p>
		</FullPageWrapper>
	);
}
