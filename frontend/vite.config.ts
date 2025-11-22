import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const HOST_NAME = process.env.VITE_HOST || 'localhost';

export default defineConfig({
	plugins: [react()],
	server: {
		host: '0.0.0.0',
		allowedHosts: [
			'0.0.0.0',
			'localhost',
			HOST_NAME,
			'react-frontend-production-9bec.up.railway.app',
		],
		strictPort: true,
	},
})
