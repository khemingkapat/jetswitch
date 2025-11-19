import React, { useState } from 'react';
import { Music, Loader2, AlertCircle, Paperclip, ArrowRight, ArrowLeft } from 'lucide-react';
import SongItem from '../components/SongItem';
import FullPageWrapper from '../components/FullPageWrapper';
import { useAuth } from '../context/AuthContext';

const MusicUploadPage = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [result, setResult] = useState<any>(null);

	const [isUploadMode, setIsUploadMode] = useState(false);

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
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					query_song_id: result.song.id,
					suggested_song_id: songId,
					vote: vote,
				}),
			});
			console.log(`Feedback sent: Song ${songId}, Vote ${vote}`);
		} catch (err: any) {
			console.error('Failed to send feedback:', err.message);
		}
	};

	const renderContent = () => {
		if (loading) {
			return (
				<div className="max-w-2xl mx-auto mt-8">
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20 min-h-[1vh] flex flex-col justify-center">
						<Loader2 className="w-20 h-20 text-pink-400 animate-spin mx-auto mb-6" />
						<h2 className="text-3xl font-bold text-white mb-3">Extracting...</h2>
						<p className="text-white/70 text-lg">
							Analyzing your track's audio features
						</p>
					</div>
				</div>
			);
		}

		if (result) {
			return (
				<div className="space-y-8">
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-3xl font-bold text-white">Post Track</h2>
							<button
								onClick={handleReset}
								className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
							>
								Back
							</button>
						</div>
						<div className="bg-gray-800/50 rounded-lg p-6">
							<h3 className="text-2xl font-bold text-white mb-2">
								{result.song.title}
							</h3>
							<p className="text-xl text-white/80 mb-4">{result.song.artist_name}</p>
							<div className="flex gap-2 flex-wrap">
								<span className="px-3 py-1 bg-pink-500/30 text-white rounded-full text-sm">
									{result.song.source_platform}
								</span>
							</div>
						</div>
					</div>

					<div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold text-white">Matching Result</h2>
						</div>

						{/* UPDATED: replaced max-h-[340px] → max-h-[60vh] */}
						<div className="space-y-4 max-h-[34vh] overflow-y-auto pr-2 scrollbar-thin">
							{result.similar_songs && result.similar_songs.length > 0 ? (
								result.similar_songs.map((song: any) => (
									<SongItem
										key={song.id}
										song={song}
										onThumbsUp={id => sendFeedback(id, 1)}
										onThumbsDown={id => sendFeedback(id, -1)}
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

		if (isUploadMode) {
			return (
				<div className="max-w-3xl mx-auto">

					{/* UPDATED: min-h-[600px] → min-h-[70vh] */}
					<div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-white/20 min-h-[70vh] flex flex-col justify-center">
						<h2 className="text-3xl font-semibold text-white/90 mb-8 text-center">
							Enter Track Details
						</h2>
						<form
							onSubmit={handleSubmit}
							className="space-y-8 text-left max-w-xl mx-auto w-full"
						>
							<div>
								<label className="block text-white/90 text-lg font-semibold mb-3">
									Track Link
								</label>
								<input
									type="url"
									value={url}
									onChange={e => setUrl(e.target.value)}
									placeholder="https://www.youtube.com/watch?v=..."
									required
									className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>
							<div>
								<label className="block text-white/90 text-lg font-semibold mb-3">
									Title
								</label>
								<input
									type="text"
									value={title}
									onChange={e => setTitle(e.target.value)}
									placeholder="Enter song title"
									required
									className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>
							<div>
								<label className="block text-white/90 text-lg font-semibold mb-3">
									Artist
								</label>
								<input
									type="text"
									value={artistName}
									onChange={e => setArtistName(e.target.value)}
									placeholder="Enter artist name"
									required
									className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>

							<div className="flex items-center justify-between pt-6 border-t border-white/10">
								<button
									type="button"
									onClick={() => setIsUploadMode(false)}
									className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white text-lg rounded-xl transition-all flex items-center gap-2"
								>
									<ArrowLeft className="w-5 h-5" />
									Back
								</button>
								<button
									type="submit"
									disabled={!url || !title || !artistName}
									className="px-8 py-3 bg-white text-red-500 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									Analyze
									<ArrowRight className="w-5 h-5" />
								</button>
							</div>
						</form>
					</div>
				</div>
			);
		}

		return (
			<div className="max-w-3xl mx-auto">
				<div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/20">
					<h2 className="text-4xl font-semibold text-gray-200 mb-8 text-center">
						Upload Seed Track
					</h2>

					<div className="bg-white/5 rounded-2xl p-4 sm:p-6">

						<div className="rounded-xl w-full min-h-[0.5vh] flex flex-col items-center justify-center">
							<h3 className="text-5xl md:text-6xl font-bold text-white mb-12 tracking-wide text-center drop-shadow-md">
								Add Your Track
							</h3>

							<button
								onClick={() => setIsUploadMode(true)}
								className="w-32 h-32 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-2xl group"
								aria-label="Upload Track"
							>
								<Paperclip className="w-14 h-14 text-gray-800 group-hover:text-pink-500 transition-colors" />
							</button>

							<p className="text-white/80 mt-8 text-lg font-medium">
								Click to paste URL
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<FullPageWrapper useCard={false}>
			<div className="text-center mb-8 mt-12">
				<h1 className="text-6xl md:text-7xl font-bold mb-4">
					<span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
						Find Your Vibe
					</span>
				</h1>
				<p className="text-white/40 text-xl md:text-2xl font-medium">
					Discover similar music powered by AI
				</p>
			</div>

			{error && !loading && (
				<div className="flex items-center gap-3 p-5 bg-red-500/20 border border-red-500/50 rounded-xl max-w-2xl mx-auto mb-8">
					<AlertCircle className="w-6 h-6 text-red-400" />
					<p className="text-red-200 text-lg">{error}</p>
				</div>
			)}

			{renderContent()}

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

