import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

// Define the component's props interface
// For a single-file environment, we define interfaces implicitly via prop usage.
const UploadModal = ({ isOpen, onClose, onSubmit, loading }) => {
	const [url, setUrl] = useState('');
	const [title, setTitle] = useState('');
	const [artistName, setArtistName] = useState('');

	useEffect(() => {
        // Reset form fields when modal closes
        if (!isOpen) {
            setUrl('');
            setTitle('');
            setArtistName('');
        }
    }, [isOpen]);

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(url, title, artistName);
	};

	if (!isOpen) {
		return null;
	}

	return (
		// Modal Overlay
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			{/* Modal Content */}
			<div className="bg-gray-800 text-white rounded-2xl shadow-2xl w-full max-w-md border border-white/20 animate-in fade-in zoom-in-95">
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<h3 className="text-2xl font-bold text-pink-400">Add New Track</h3>
					<button
						onClick={onClose}
						className="p-2 rounded-full hover:bg-white/10 transition-colors"
						aria-label="Close modal"
					>
						<X className="w-6 h-6 text-white" />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="p-6 space-y-6">
						{/* URL Input */}
						<div>
							<label className="block text-white/80 font-semibold mb-2">
								Paste Your Track's Link (YouTube)
							</label>
							<input
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://www.youtube.com/watch?v=..."
								required
								className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
							/>
						</div>

						{/* Title Input */}
						<div>
							<label className="block text-white/80 font-semibold mb-2">
								Title
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Enter song title"
								required
								className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
							/>
						</div>

						{/* Artist Name Input */}
						<div>
							<label className="block text-white/80 font-semibold mb-2">
								Artist Name
							</label>
							<input
								type="text"
								value={artistName}
								onChange={(e) => setArtistName(e.target.value)}
								placeholder="Enter artist name"
								required
								className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
							/>
						</div>
					</div>

					{/* Modal Footer */}
					<div className="flex items-center justify-between p-6 border-t border-white/10">
						{/* <button
							type="button"
							onClick={onClose}
							className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 font-semibold"
						>
							<ArrowLeft className="w-4 h-4" />
							Cancel
						</button> */}
						<button
							type="submit"
							disabled={loading || !url || !title || !artistName}
							className="px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
						>
							{loading ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Analyzing...
								</>
							) : (
								<>
									Analyze Track
									<ArrowRight className="w-4 h-4" />
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default UploadModal;
