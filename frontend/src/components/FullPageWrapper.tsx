import { ReactNode } from 'react';

interface FullPageWrapperProps {
	children: ReactNode;
	title?: string;
	useCard?: boolean;
}

export default function FullPageWrapper({ children, title, useCard = true }: FullPageWrapperProps) {
	const gradientStyle = {
		position: 'fixed' as 'fixed',
		inset: 0,
		display: 'flex',
		alignItems: 'center' as 'center',
		justifyContent: 'center',
		background: 'linear-gradient(180deg, #EE8555 0%, #F28E88 22%)',
		padding: '20px',
		overflowY: 'auto' as 'auto',
	};

	const cardWrapperStyle = {
		backgroundColor: 'white',
		maxWidth: '450px',
		width: '100%',
		padding: '30px',
		borderRadius: '12px',
		boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
		color: '#242424',
		textAlign: 'center' as 'center',
		margin: 'auto',
	};

	// CRITICAL CHANGE FOR LANDING PAGE: Remove horizontal constraints
	const directContentStyle = {
		display: 'flex',
		flexDirection: 'column' as 'column', // Force content to stack vertically
		alignItems: 'center' as 'center', // Center content horizontally
		justifyContent: 'center',
		width: '100%',
		// Removed maxWidth: '1200px' to simplify layout
		height: '100%', // Use full height of the fixed wrapper
	};

	const header = title ? (
		<h1 style={{
			color: '#FF6C6C',
			fontSize: '2.5em',
			marginBottom: '20px'
		}}>
			{title}
		</h1>
	) : null;

	const cardContent = (
		<div style={cardWrapperStyle}>
			{header}
			{children}
		</div>
	);

	const directContent = (
		<div style={directContentStyle}>
			{children}
		</div>
	);

	return (
		<div style={gradientStyle}>
			{useCard ? cardContent : directContent}
		</div>
	);
}

