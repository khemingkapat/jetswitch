import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import AuthCallback from './components/AuthCallback';
import SelectUserType from './pages/SelectUserType';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import './App.css';
import MusicUploadPage from './pages/MusicUpload';

type WithChildren = { children: JSX.Element };

function ProtectedRoute({ children }: WithChildren): JSX.Element {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App(): JSX.Element {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					{/* Public landing — displays different views based on auth state */}
					<Route path="/" element={<LandingPage />} />

					{/* Auth-only Home */}
					<Route
						path="/home"
						element={
							<ProtectedRoute>
								<HomePage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/upload"
						element={
							<ProtectedRoute>
								<MusicUploadPage />
							</ProtectedRoute>
						}
					/>

					{/* Auth */}
					<Route path="/register" element={<Register />} />
					<Route path="/login" element={<Login />} />
					<Route path="/auth/callback" element={<AuthCallback />} />
					<Route path="/select-user-type" element={<SelectUserType />} />

					{/* Catch-all */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
