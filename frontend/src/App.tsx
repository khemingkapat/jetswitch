import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import AuthCallback from './components/AuthCallback';
import SelectUserType from './pages/SelectUserType';
import LandingPage from './pages/LandingPage';
import './App.css';

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/register" element={<Register />} />
					<Route path="/login" element={<Login />} />
					<Route path="/auth/callback" element={<AuthCallback />} />
					<Route path="/select-user-type" element={<SelectUserType />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
