import React, { useState } from 'react';
import { Music, Loader2, AlertCircle, Paperclip, ArrowRight, ArrowLeft } from 'lucide-react';
import SongItem from '../components/SongItem';
import FullPageWrapper from '../components/FullPageWrapper';
import { useAuth } from '../context/AuthContext';

const MusicUploadPage = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [result, setResult] = useState<any>(null);

	// State for managing the view mode
	const [isUploadMode, setIsUploadMode] = useState(false);

	// Form State
	const [url, setUrl] = useState('');
	const [title, setTitle] = useState('');
	const [artistName, setArtistName] = useState('');

	const { token } = useAuth();

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		setError('');
		setLoading(true);

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
					source_platform: 'youtube',
					added_by: 1,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to analyze music');
			}

			const data = await response.json();
			setResult(data);
			setIsUploadMode(false);
		} catch (err: any) {
			setError(err.message || 'An error occurred while analyzing the music');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setResult(null);
		setError('');
		setIsUploadMode(false);
		setUrl('');
		setTitle('');
		setArtistName('');
	};

	const sendFeedback = async (songId: number, vote: number) => {
		if (!token || !result?.song) return;

		try {
			await fetch('http://localhost:8080/api/music/feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					query_song_id: result.song.id,
					suggested_song_id: songId,
					vote: vote
				}),
			});
			console.log(`Feedback sent: Song ${songId}, Vote ${vote}`);
		} catch (err: any) {
			console.error("Failed to send feedback:", err.message);
		}
	};

	const renderContent = () => {
		if (loading) {
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
			return (
				<div className="space-y-8">
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
								<span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">Rock</span>
							</div>
						</div>
					</div>

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
										onThumbsUp={(id) => sendFeedback(id, 1)}
										onThumbsDown={(id) => sendFeedback(id, -1)}
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

		// Upload Form Mode (In the box)
		if (isUploadMode) {
			return (
				<div className="max-w-2xl mx-auto">
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
						<h2 className="text-2xl font-semibold text-white/80 mb-6 text-center">Enter Track Details</h2>
						<form onSubmit={handleSubmit} className="space-y-6 text-left">
							<div>
								<label className="block text-white/80 font-semibold mb-2">Track Link</label>
								<input
									type="url"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://www.youtube.com/watch?v=..."
									required
									className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>
							<div>
								<label className="block text-white/80 font-semibold mb-2">Title</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Enter song title"
									required
									className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>
							<div>
								<label className="block text-white/80 font-semibold mb-2">Artist</label>
								<input
									type="text"
									value={artistName}
									onChange={(e) => setArtistName(e.target.value)}
									placeholder="Enter artist name"
									required
									className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>

							<div className="flex items-center justify-between pt-4 border-t border-white/10">
								<button
									type="button"
									onClick={() => setIsUploadMode(false)}
									className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2"
								>
									<ArrowLeft className="w-4 h-4" />
									Back
								</button>
								<button
									type="submit"
									disabled={!url || !title || !artistName}
									className="px-6 py-2 bg-white text-red-500 font-bold rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									Analyze
									<ArrowRight className="w-4 h-4" />
								</button>
							</div>
						</form>
					</div>
				</div>
			);
		}

		// Default State: Initial Upload Button
		return (
			<div className="max-w-2xl mx-auto">
				<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
					<h2 className="text-2xl font-semibold text-gray-200 mb-6 text-center">Upload Seed Track</h2>

					{/* --- NEW WRAPPER BLOCK START --- */}
					<div className="bg-white/5 rounded-xl p-6 border border-white/10">
						{/* This wraps the ADD YOUR TRACK box to create the 'block inside' effect */}

						<div className="bg-gradient-to-br from-pink-400 to-red-400 rounded-lg p-12 flex flex-col items-center justify-center border border-white/30 shadow-inner">
							<h3 className="text-4xl font-bold text-white mb-6">ADD YOUR TRACK</h3>
							<button
								onClick={() => setIsUploadMode(true)}
								className="w-24 h-24 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg group"
							>
								<Paperclip className="w-10 h-10 text-gray-800 group-hover:text-pink-500 transition-colors" />
							</button>
						</div>

					</div>
					{/* --- NEW WRAPPER BLOCK END --- */}

				</div>
			</div>
		);
	};

	return (
		<FullPageWrapper useCard={false}>
			<div className="text-center mb-10 mt-8">
				<h1 className="text-5xl font-bold mb-2">
					<span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
						Find Your Vibe
					</span>
				</h1>
				<p className="text-gray-500 text-lg font-medium">Discover similar music powered by AI</p>
			</div>

			<div
				style={{
					background: 'linear-gradient(180deg, rgba(255, 108, 108, 0.4) 0%, rgba(255, 140, 74, 0.4) 100%)',
					maxWidth: '1000px',
					width: '95%',
					margin: '0 auto',
					padding: '40px',
					borderRadius: '24px',
					boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
					color: 'white',
				}}
			>
				{error && !loading && (
					<div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-lg max-w-2xl mx-auto mb-8">
						<AlertCircle className="w-5 h-5 text-red-400" />
						<p className="text-red-200">{error}</p>
					</div>
				)}

				{renderContent()}
			</div>

			<style>{`
                .scrollbar-thin::-webkit-scrollbar { width: 8px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(244, 114, 182, 0.5); border-radius: 4px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(244, 114, 182, 0.7); }
            `}</style>
		</FullPageWrapper>
	);
};

export default MusicUploadPage;
