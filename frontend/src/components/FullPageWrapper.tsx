import { ReactNode } from 'react';

interface FullPageWrapperProps {
	children: ReactNode;
	title?: string;
	useCard?: boolean;
}

export default function FullPageWrapper({ children, title, useCard = true }: FullPageWrapperProps) {
	const directContentStyle = {
		display: 'flex',
		flexDirection: 'column' as 'column',
		alignItems: 'center' as 'center',
		justifyContent: 'center',
		width: '100%',
		height: '100%',
	};

	const header = title ? (
		<h1 className="auth-header" style={{ fontWeight: 'bold' }}>
			{title}
		</h1>
	) : null;

	const cardContent = (
		<div className="auth-card">
			{header}
			{children}
		</div>
	);

	const directContent = <div style={directContentStyle}>{children}</div>;

	return <div className="full-page-gradient">{useCard ? cardContent : directContent}</div>;
}
