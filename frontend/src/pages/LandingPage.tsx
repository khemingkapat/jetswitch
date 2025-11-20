import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageWrapper from '../components/FullPageWrapper';

export default function LandingPage() {
	const { user, isAuthenticated, logout } = useAuth();

	const buttonStyle = {
		padding: '12px 30px',
		fontSize: '18px',
		fontWeight: '600',
		borderRadius: '8px',
		border: 'none',
		cursor: 'pointer',
		transition: 'background-color 0.3s',
		fontFamily: 'inherit'
	};

	const primaryButtonStyle = {
		...buttonStyle,
		backgroundColor: 'white',
		color: '#FF6C6C',
		background: 'white'
	};

	// Content when user is NOT logged in
	const GuestView = () => (
		<div style={{
			maxWidth: '600px',
			textAlign: 'center',
			color: 'white',
		}}>
			<h1 style={{
				margin: '0 0 10px 0',
				color: '#FFFFFF',
				fontSize: '5em',
				marginBottom: 20,
				fontWeight: 'bold'
			}}>
				JETSWITCH
			</h1>
			<p style={{
				fontSize: '1.2em',
				marginBottom: '40px'
			}}>
				Unlock your music taste. Find songs that match your unique style.
			</p>

			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				gap: '20px'
			}}>
				{/* Redirects to Login if not authenticated */}
				<Link to="/login">
					<button style={primaryButtonStyle}>
						Get Started
					</button>
				</Link>
			</div>
		</div>
	);

	// Content when user IS logged in (Auth Dashboard)
	const AuthenticatedView = () => (
		<div style={{
			backgroundColor: 'white',
			maxWidth: '450px',
			width: '100%',
			padding: '30px',
			borderRadius: '12px',
			boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
			color: '#242424',
			textAlign: 'center',
			margin: 'auto',
		}}>
			<h1 style={{ color: '#FF6C6C', fontSize: '2.5em', marginBottom: '20px', fontWeight: 'bold' }}>
				JETSWITCH
			</h1>
			<h2 style={{ margin: '0 0 15px 0' }}>Welcome back, {user?.username}!</h2>
			<p>You are logged in as {user?.user_type}.</p>
			<p>Ready to discover music.</p>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '25px' }}>
				{/* Redirects to Upload if authenticated */}
				<Link to="/upload">
					<button style={{
						...buttonStyle,
						backgroundColor: '#FF6C6C',
						color: 'white',
						width: '100%'
					}}>
						Get Started
					</button>
				</Link>

				<button onClick={logout} style={{
					...buttonStyle,
					backgroundColor: '#535bf2',
					color: 'white',
					width: '100%'
				}}>
					LOGOUT
				</button>
			</div>
		</div>
	);

	return (
		<FullPageWrapper useCard={false}>
			{isAuthenticated ? <AuthenticatedView /> : <GuestView />}
		</FullPageWrapper>
	);
}
