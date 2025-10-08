import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
	id: number;
	username: string;
	email: string;
	user_type: string;
	avatar_url?: string;
	auth_provider: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (token: string, user: User) => void;
	logout: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {
		const savedToken = localStorage.getItem('token');
		const savedUser = localStorage.getItem('user');

		if (savedToken && savedUser) {
			setToken(savedToken);
			setUser(JSON.parse(savedUser));
		}
	}, []);

	const login = (newToken: string, newUser: User) => {
		setToken(newToken);
		setUser(newUser);
		localStorage.setItem('token', newToken);
		localStorage.setItem('user', JSON.stringify(newUser));
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				login,
				logout,
				isAuthenticated: !!token
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
}
