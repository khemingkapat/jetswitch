import React, { useState } from 'react';
import { Music, Loader2, AlertCircle, Paperclip } from 'lucide-react';
import SongItem from '../components/SongItem'; // Import the SongItem component
import FullPageWrapper from '../components/FullPageWrapper'; // Import the wrapper
import UploadModal from '../components/UploadModal'; // Import the new modal
import { useAuth } from '../context/AuthContext';

// Main Upload Page Component
const MusicUploadPage = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [result, setResult] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { token } = useAuth();

	const handleSubmit = async (url: string, title: string, artistName: string) => {
		setError('');
		setLoading(true);
		setIsModalOpen(false); // Close modal on submit

		try {
			const response = await fetch('http://localhost:8080/api/music/analyze', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					url: url,
					title: title,
					artist_name: artistName,
					source_platform: 'youtube', // Hardcoded as per your old code
					added_by: 1, // You can update this later with real user ID
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to analyze music');
			}

			const data = await response.json();
			setResult(data);
		} catch (err: any) {
			setError(err.message || 'An error occurred while analyzing the music');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setResult(null);
		setError('');
		// We don't need to reset form fields here, modal state does it
	};
	const sendFeedback = async (songId: number, vote: number) => {
		if (!token) {
			console.error("No token, cannot send feedback");
			return;
		}
		if (!result || !result.song) {
			console.error("No query song data, cannot send feedback");
			return;
		}

		const querySongId = result.song.id;

		try {
			const response = await fetch('http://localhost:8080/api/music/feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}` // Send the auth token
				},
				body: JSON.stringify({
					query_song_id: querySongId,
					suggested_song_id: songId,
					vote: vote // 1 for up, -1 for down
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to send feedback');
			}

			console.log(`Feedback sent: Song ${songId}, Vote ${vote}`);
			// You could add visual feedback here, like making the button glow

		} catch (err: any) {
			console.error("Failed to send feedback:", err.message);
			// Optionally show a small error to the user
		}
	};

	const handleThumbsUp = (songId: number) => {
		console.log('Thumbs up for song:', songId);
		// --- 4. CALL THE HELPER ---
		sendFeedback(songId, 1);
	};

	const handleThumbsDown = (songId: number) => {
		console.log('Thumbs down for song:', songId);
		// --- 5. CALL THE HELPER ---
		sendFeedback(songId, -1);
	};


	// Renders the main content based on state
	const renderContent = () => {
		if (loading) {
			// Loading State (matches Figma "Extracting...")
			return (
				<div className="max-w-2xl mx-auto mt-8">
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
						<Loader2 className="w-16 h-16 text-pink-400 animate-spin mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-white mb-2">Extracting...</h2>
						<p className="text-white/70">Analyzing your track's audio features</p>
						<div className="mt-6 w-full bg-white/10 rounded-full h-2 overflow-hidden">
							<div className="h-full bg-gradient-to-r from-pink-400 to-red-400 animate-pulse" style={{ width: '70%' }} />
						</div>
					</div>
				</div>
			);
		}

		if (result) {
			// Results State (matches Figma "Similar Song Result")
			return (
				<div className="space-y-8">
					{/* Your Track */}
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-3xl font-bold text-white">Postr Track</h2>
							<button
								onClick={handleReset}
								className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
							>
								Back
							</button>
						</div>
						<div className="bg-gray-800/50 rounded-lg p-6">
							<h3 className="text-2xl font-bold text-white mb-2">{result.song.title}</h3>
							<p className="text-xl text-white/80 mb-4">{result.song.artist_name}</p>
							<div className="flex gap-2 flex-wrap">
								<span className="px-3 py-1 bg-pink-500/30 text-white rounded-full text-sm">
									{result.song.source_platform}
								</span>
								{/* Hardcoded tags from your old code */}
								<span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">Rock</span>
								<span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">Thrash</span>
								<span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">Metal</span>
							</div>
						</div>
					</div>

					{/* Similar Songs */}
					<div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold text-white">Matching Result</h2>
						</div>
						<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
							{result.similar_songs && result.similar_songs.length > 0 ? (
								result.similar_songs.map((song: any) => (
									<SongItem
										key={song.id}
										song={song}
										onThumbsUp={handleThumbsUp}
										onThumbsDown={handleThumbsDown}
									/>
								))
							) : (
								<div className="text-center py-12">
									<p className="text-white/50 text-lg">No similar songs found</p>
								</div>
							)}
						</div>
					</div>
				</div>
			);
		}

		// Default State (matches Figma "Upload Seed Track")
		return (
			<div className="max-w-2xl mx-auto">
				<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
					<h2 className="text-2xl font-semibold text-white/80 mb-6">Upload Seed Track</h2>
					<div className="bg-gradient-to-br from-pink-500/30 to-red-500/30 rounded-lg p-12 flex flex-col items-center justify-center border border-white/20">
						<h3 className="text-4xl font-bold text-white mb-6">ADD YOUR TRACK</h3>
						<button
							onClick={() => setIsModalOpen(true)}
							className="w-24 h-24 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
						>
							<Paperclip className="w-10 h-10 text-gray-800" />
						</button>
					</div>
				</div>
			</div>
		);
	};

	return (
		<FullPageWrapper useCard={false}>
			<div className="max-w-6xl mx-auto p-8">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-5xl font-bold text-white mb-4">
						<span className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
							Find Your Vibe
						</span>
					</h1>
					<p className="text-white/70 text-lg">Discover similar music powered by AI</p>
				</div>

				{/* Error Message */}
				{error && !loading && (
					<div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-lg max-w-2xl mx-auto mb-8">
						<AlertCircle className="w-5 h-5 text-red-400" />
						<p className="text-red-200">{error}</p>
					</div>
				)}

				{/* Main Content Area */}
				{renderContent()}
			</div>

			{/* The Modal */}
			<UploadModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSubmit}
				loading={loading}
			/>

			{/* Scrollbar styles - kept here as they are specific to this page */}
			<style>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 8px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(244, 114, 182, 0.5);
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(244, 114, 182, 0.7);
                }
            `}</style>
		</FullPageWrapper>
	);
};

export default MusicUploadPage;
