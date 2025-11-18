import React, { useState, createContext, useContext } from 'react';
import { Loader2, AlertCircle, Paperclip } from 'lucide-react';
import FullPageWrapper from '../components/FullPageWrapper';
import UploadModal from '../components/UploadModal';
import SongItem from '../components/SongItem';
import { useNavigate } from 'react-router-dom';

// --- MINIMAL DEPENDENCY DEFINITIONS ---
// These are required placeholders for hooks used by the component.
const AuthContext = createContext({ token: 'mock-user-token' });
const useAuth = () => useContext(AuthContext);


// --- Main Upload Page Component ---
const MusicUploadPage = () => {
	const { token } = useAuth();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [result, setResult] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleTitleClick = () => {
        navigate('/home');
    };

	const handleSubmit = async (url: string, title: string, artistName: string) => {
		setError('');
		setLoading(true);
		setIsModalOpen(false); // Close modal on submit

		try {
			console.log(`Submitting: URL=${url}, Title=${title}, Artist=${artistName}`);

			// --- ACTUAL API CALL (UNMOCKED) ---
			const response = await fetch('http://localhost:8080/api/music/analyze', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					url: url,
					title: title,
					artist_name: artistName,
					source_platform: 'youtube',
					added_by: 1, // Placeholder user ID
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
	};

	const sendFeedback = async (songId: number, vote: number) => {
		if (!token) {
			console.error("No token, cannot send feedback");
			return;
		}
		if (!result) {
			console.error("No query song data, cannot send feedback");
			return;
		}

		const querySongId = result.song.id;

		try {
			// --- ACTUAL API CALL (UNMOCKED) ---
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
		} catch (err: any) {
			console.error("Failed to send feedback:", err.message);
		}
	};

	const handleThumbsUp = (songId: number) => {
		sendFeedback(songId, 1);
	};

	const handleThumbsDown = (songId: number) => {
		sendFeedback(songId, -1);
	};


	// Renders the main content based on state
	const renderContent = () => {
		if (loading) {
			// Loading State (Extracting...)
			return (
				<div className="max-w-2xl mx-auto mt-8">
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20 shadow-2xl">
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
			// Results State (Similar Song Result)
			return (
				<div className="space-y-8">
					{/* Your Track */}
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
							<h2 className="text-3xl font-bold text-white mb-4 sm:mb-0">Postr Track</h2>
							<button
								onClick={handleReset}
								className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold"
							>
								Start New Analysis
							</button>
						</div>
						<div className="bg-gray-800/50 rounded-lg p-6">
							<h3 className="text-2xl font-bold text-white mb-2">{result.song.title}</h3>
							<p className="text-xl text-white/80 mb-4">{result.song.artist_name}</p>
							<div className="flex gap-2 flex-wrap">
								<span className="px-3 py-1 bg-pink-500/30 text-white rounded-full text-sm font-medium">
									{result.song.source_platform}
								</span>
								<span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">Rock</span>
								<span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">Metal</span>
							</div>
						</div>
					</div>

					{/* Similar Songs */}
					<div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold text-white">Matching Results</h2>
						</div>
						<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
							{result.similar_songs && result.similar_songs.length > 0 ? (
								result.similar_songs.map((song) => (
									<SongItem
										key={song.id}
										song={song}
										onThumbsUp={handleThumbsUp}
										onThumbsDown={handleThumbsDown}
									/>
								))
							) : (
								<div className="text-center py-12">
									<p className="text-white/50 text-lg">No similar songs found based on analysis.</p>
								</div>
							)}
						</div>
					</div>
				</div>
			);
		}

		// Default State (Upload Seed Track) - This is the content inside the white card
		return (
			<>
				{/* Header elements inside the card content */}
				<div className="text-center mb-12">
					<h1 className="text-3xl font-bold text-gray-800 mb-2">
						Find Your Vibe
					</h1>
					<p className="text-gray-600 text-md">Discover similar music powered by AI</p>
				</div>

				<div className="max-w-2xl mx-auto w-full">
					<div className="bg-gradient-to-br from-pink-500/30 to-red-500/30 rounded-lg p-12 shadow-inner border border-white/20 text-center">
						<h3 className="text-3xl font-bold text-white mb-6">UPLOAD SEED TRACK</h3>
						<button
							onClick={() => setIsModalOpen(true)}
							className="w-20 h-20 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl hover:shadow-2xl active:scale-95 transform duration-150 ease-in-out mx-auto"
							aria-label="Add track and open upload form"
						>
							<Paperclip className="w-8 h-8 text-gray-800" />
						</button>
						<p className="text-white/80 text-sm mt-4">Click to enter track details</p>
					</div>
				</div>
			</>
		);
	};

	return (
		// FIX: Setting useCard=true to restore the centered white box style.
		<FullPageWrapper useCard={true} title="JETSWITCH" onTitleClick={handleTitleClick}>
			{/* Error Message */}
			{error && !loading && (
				<div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-lg max-w-sm mx-auto mb-8 shadow-md">
					<AlertCircle className="w-5 h-5 text-red-400" />
					<p className="text-red-200 text-sm">{error}</p>
				</div>
			)}

			{/* Main Content Area */}
			{renderContent()}

			{/* The Modal - This is the pop-up that appears */}
			<UploadModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSubmit}
				loading={loading}
			/>

			{/* Custom Scrollbar and Keyframe Styles for Aesthetics (kept here for single file environment) */}
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
                /* Custom utility for the modal animation (since we can't use external libraries like 'tailwind-animate') */
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom-in-95 { from { transform: scale(0.95); } to { transform: scale(1); } }
                .animate-in {
                    animation-duration: 0.3s;
                    animation-timing-function: ease-out;
                }
                .fade-in { animation-name: fade-in; }
                .zoom-in-95 { animation-name: zoom-in-95; }
            `}</style>
		</FullPageWrapper>
	);
};

export default MusicUploadPage;
