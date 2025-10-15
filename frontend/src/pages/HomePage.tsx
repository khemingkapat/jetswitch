import React from 'react';
import { useAuth } from '../context/AuthContext';
import FullPageWrapper from '../components/FullPageWrapper';

export default function HomePage(): JSX.Element {
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
				<h1 style={{ color: '#FF6C6C', fontSize: '2.5em', marginBottom: 20 }}>JETSWITCH</h1>
				<h2 style={{ margin: '0 0 15px' }}>
					Welcome back{user?.username ? `, ${user.username}` : ''}!
				</h2>
				<p>
					{user?.user_type
						? `You are logged in as ${user.user_type}.`
						: 'You are logged in.'}
				</p>
				<p>Ready to discover music.</p>
				<button type="button" onClick={logout} style={btn}>
					LOGOUT
				</button>
			</div>
		</FullPageWrapper>
	);
}
