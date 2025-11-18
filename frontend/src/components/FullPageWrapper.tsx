import React from 'react';

// This is the component that wraps the whole application, providing the gradient background.
const FullPageWrapper = ({ children, title, useCard = false, onTitleClick }) => {
	const gradientStyle = {
		position: 'fixed',
		inset: 0,
		display: 'flex',
		alignItems: 'center', // Align content to the top
		justifyContent: 'center',
		background: 'linear-gradient(180deg, #EE8555 0%, #F28E88 22%)',
		padding: '40px 20px', // Add more vertical padding
		overflowY: 'auto',
	};

	const cardWrapperStyle = {
		backgroundColor: 'white',
		maxWidth: '450px',
		width: '100%',
		padding: '30px',
		borderRadius: '12px',
		boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
		color: '#242424',
		textAlign: 'center',
		margin: 'auto', // Keep centering logic for the small card
	};

	// FIX: This style now uses Tailwind max-width classes for responsiveness
    // and keeps content aligned center while ensuring it's contained.
	const directContentStyle = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		width: '100%',
		maxWidth: '1200px', // Restore max-width constraint for main content area
	};

	const header = title ? (
		<h1
			onClick={onTitleClick}
			style={{
			color: '#FF6C6C',
			fontSize: '2.5em',
			marginBottom: '20px',
			cursor: onTitleClick ? 'pointer' : 'default'
		}}>
			{title}
		</h1>
	) : null;

	const cardContent = (
        // Wrapper for the small card look
		<div style={cardWrapperStyle}>
			{header}
			{children}
		</div>
	);

	const directContent = (
        // Wrapper for the full page content (where JETSWITCH title and the content box will be separate)
		<div style={directContentStyle}>
            {header}
			{children}
		</div>
	);

	return (
		<div style={gradientStyle}>
			{/* FIX: Ensure the header is always rendered inside the appropriate container */}
			{useCard ? cardContent : directContent}
		</div>
	);
}
export default FullPageWrapper;
