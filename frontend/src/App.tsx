import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import SelectUserType from './components/SelectUserType';
import './App.css';

function Home() {
	const { user, logout, isAuthenticated } = useAuth();

	return (
		<div>
			<h1>Welcome to JetSwitch</h1>

			{isAuthenticated ? (
				<div>
					{user?.avatar_url && (
						<img
							src={user.avatar_url}
							alt={user.username}
							style={{
								width: '80px',
								height: '80px',
								borderRadius: '50%',
								marginBottom: '20px'
							}}
						/>
					)}
					<p>Hello, <strong>{user?.username}</strong>!</p>
					<p>Account Type: <strong>{user?.user_type}</strong></p>
					<p>Auth Provider: <strong>{user?.auth_provider}</strong></p>
					<button onClick={logout}>Logout</button>
				</div>
			) : (
				<div>
					<p>Please login or register to continue</p>
					<Link to="/login">
						<button style={{ marginRight: '10px' }}>Login</button>
					</Link>
					<Link to="/register">
						<button>Register</button>
					</Link>
				</div>
			)}
		</div>
	);
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Home />} />
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
