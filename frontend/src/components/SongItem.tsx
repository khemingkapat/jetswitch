import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// Reusable Waveform Placeholder Component
// This is a local component used only by SongItem, so it stays in this file
const WaveformPlaceholder = ({ className = "" }) => {
	return (
		<div className={`h-12 bg-gradient-to-r from-pink-400 via-red-400 to-pink-400 rounded-full relative overflow-hidden ${className}`}>
			<div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
				{[...Array(60)].map((_, i) => (
					<div
						key={i}
						className="flex-1 bg-white/30 rounded-full"
						style={{
							height: `${Math.random() * 60 + 40}%`,
						}}
					/>
				))}
			</div>
		</div>
	);
};

// Define types for props
interface Song {
	id: number;
	title: string;
	artist_name: string;
	score: number;
}

interface SongItemProps {
	song: Song;
	onThumbsUp?: (id: number) => void;
	onThumbsDown?: (id: number) => void;
}

// Reusable Song Item Component with Waveform
const SongItem: React.FC<SongItemProps> = ({ song, onThumbsUp, onThumbsDown }) => {
	return (
		<div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-all">
			<div className="flex items-center justify-between mb-3">
				<div className="flex-1 min-w-0">
					<h3 className="text-white font-semibold truncate">{song.title}</h3>
					<p className="text-white/70 text-sm truncate">{song.artist_name}</p>
				</div>
				<div className="flex items-center gap-3 ml-4">
					<div className="flex items-center gap-1 bg-amber-500 px-3 py-1 rounded-full">
						<span className="text-white font-bold">★</span>
						<span className="text-white font-semibold">{song.score.toFixed(5)}</span>
					</div>
					<button
						onClick={() => onThumbsUp?.(song.id)}
						className="p-2 bg-white/10 hover:bg-green-500/30 rounded-full transition-all"
						aria-label="Thumbs up"
					>
						<ThumbsUp className="w-5 h-5 text-white" />
					</button>
					<button
						onClick={() => onThumbsDown?.(song.id)}
						className="p-2 bg-white/10 hover:bg-red-500/30 rounded-full transition-all"
						aria-label="Thumbs down"
					>
						<ThumbsDown className="w-5 h-5 text-white" />
					</button>
				</div>
			</div>
			<WaveformPlaceholder />
		</div>
	);
};

export default SongItem;
