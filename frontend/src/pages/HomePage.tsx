import React from 'react';
import { useAuth } from '../context/AuthContext';
import FullPageWrapper from '../components/FullPageWrapper';
import { Link } from 'react-router-dom'; // Import Link to create navigation

export default function HomePage(): React.JSX.Element {
	const { user, logout } = useAuth();

	const btn: React.CSSProperties = {
		padding: '12px 30px',
		fontSize: '18px',
		fontWeight: 600,
		borderRadius: '8px',
		border: 'none',
		cursor: 'pointer',
		transition: 'background-color 0.3s',
		fontFamily: 'inherit',
	};

	// Style for the new button
	const primaryBtn: React.CSSProperties = {
		...btn,
		backgroundColor: '#FF6C6C', // Use the app's theme color
		color: '#fff',
		marginRight: '15px', // Add space between buttons
	};

	const logoutBtn: React.CSSProperties = {
		...btn,
		backgroundColor: '#535bf2',
		color: '#fff',
	};

	return (
		<FullPageWrapper useCard={false}>
			<div
				style={{
					backgroundColor: 'white',
					maxWidth: 450,
					width: '100%',
					padding: 30,
					borderRadius: 12,
					boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
					color: '#242424',
					textAlign: 'center',
					margin: 'auto',
				}}
				role="region"
				aria-label="Home Dashboard"
			>
				<h1 style={{ color: '#FF6C6C', fontSize: '2.5em', marginBottom: 20, fontWeight: 'bold' }}>JETSWITCH</h1>
				<h2 style={{ margin: '0 0 15px' }}>
					Welcome back{user?.username ? `, ${user.username}` : ''}!
				</h2>
				<p>
					{user?.user_type
						? `You are logged in as ${user.user_type}.`
						: 'You are logged in.'}
				</p>
				<p>Ready to discover music.</p>

				{/* --- I'VE UPDATED THIS SECTION --- */}
				<div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center' }}>
					{/* ADDED THIS LINK AND BUTTON */}
					<Link to="/upload">
						<button type="button" style={primaryBtn}>
							Upload Music
						</button>
					</Link>
					{/* UPDATED LOGOUT BUTTON to use new style */}
					<button type="button" onClick={logout} style={logoutBtn}>
						LOGOUT
					</button>
				</div>
				{/* --- END OF UPDATE --- */}

			</div>
		</FullPageWrapper>
	);
}
