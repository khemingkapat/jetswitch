import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { ThumbsUp, ThumbsDown, Play, Pause } from 'lucide-react';

interface Song {
	id: number;
	title: string;
	artist_name: string;
	score: number;
	url: string; // The song URL
}

interface SongItemProps {
	song: Song;
	onThumbsUp?: (id: number) => void;
	onThumbsDown?: (id: number) => void;
}

const SongItem: React.FC<SongItemProps> = ({ song, onThumbsUp, onThumbsDown }) => {
	// No changes to state or logs
	console.log(`[Song ${song.id}] Rendered. URL: ${song.url}`);

	useEffect(() => {
		console.log(`[Song ${song.id}] MOUNTED with URL: ${song.url}`);
	}, [song.id, song.url]);

	const [playing, setPlaying] = useState(false);
	const [played, setPlayed] = useState(0);       // Fraction 0 to 1
	const [seeking, setSeeking] = useState(false);
	const [duration, setDuration] = useState(0);     // Duration in seconds

	const playerRef = useRef<HTMLVideoElement>(null);

	// All handler functions (handlePlayPause, handleDurationChange, etc.)
	// remain exactly the same as the previous version.

	const handlePlayPause = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPlaying((prev) => {
			const next = !prev;
			console.log(`[Song ${song.id}] Play/Pause clicked. Now playing = ${next}`);
			return next;
		});
	};

	const handleDurationChange = () => {
		if (playerRef.current) {
			const newDuration = playerRef.current.duration;
			if (isFinite(newDuration)) { // Avoid NaN or Infinity
				console.log(`[Song ${song.id}] DURATION LOADED: ${newDuration}s`);
				setDuration(newDuration);
			}
		}
	};

	const handleTimeUpdate = () => {
		if (playerRef.current && !seeking && playerRef.current.duration) {
			const newPlayed = playerRef.current.currentTime / playerRef.current.duration;
			setPlayed(newPlayed);
		}
	};

	const handleSeekMouseDown = (e: React.MouseEvent) => {
		e.stopPropagation();
		setSeeking(true);
		console.log(`[Song ${song.id}] Start seeking`);
	};

	const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.stopPropagation();
		setPlayed(parseFloat(e.target.value));
	};

	const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
		e.stopPropagation();
		setSeeking(false);

		if (playerRef.current && playerRef.current.duration) {
			const newPlayedValue = parseFloat((e.target as HTMLInputElement).value); // This is the fraction (0-1)
			const currentDuration = playerRef.current.duration;
			const newTimeInSeconds = newPlayedValue * currentDuration;

			console.log(`[Song ${song.id}] Seek to: ${newTimeInSeconds}s`);
			playerRef.current.currentTime = newTimeInSeconds;
		}
	};

	const stopPropagation = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	// This function is no longer used, but we can keep it for future use
	const formatTime = (seconds: number) => {
		if (isNaN(seconds) || seconds === 0) return '0:00';
		const date = new Date(seconds * 1000);
		const ss = date.getUTCSeconds().toString().padStart(2, '0');
		const mm = date.getUTCMinutes().toString().padStart(2, '0');
		const hh = date.getUTCHours();
		return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
	};

	return (
		<div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-700/50 transition-all">
			{/* Top section (No changes here) */}
			<div className="flex items-center justify-between mb-3" onClick={stopPropagation}>
				<div className="flex-1 min-w-0">
					<h3 className="text-white font-semibold truncate">{song.title}</h3>
					<p className="text-white/70 text-sm truncate">{song.artist_name}</p>
				</div>
				<div className="flex items-center gap-3 ml-4">
					<div className="flex items-center gap-1 bg-amber-500 px-3 py-1 rounded-full">
						<span className="text-white font-bold">★</span>
						<span className="text-white font-semibold">{song.score.toFixed(2)}</span>
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

			{/* --- 1. HIDE PLAYER ---
                We add style={{ display: 'none' }} to this div to ensure
                the ReactPlayer component is not visible.
            */}
			<div
				className="mb-3"
				onClick={stopPropagation}
				style={{ display: 'none' }}
			>
				<ReactPlayer
					ref={playerRef}
					src={song.url}
					playing={playing}
					muted={!playing}
					controls={false}
					width="0"
					height="0"
					onPlay={() => {
						console.log(`[Song ${song.id}] ▶️ onPlay`);
						setPlaying(true);
					}}
					onPause={() => {
						console.log(`[Song ${song.id}] ⏸️ onPause`);
						setPlaying(false);
					}}
					onDurationChange={handleDurationChange}
					onTimeUpdate={handleTimeUpdate}
					onError={(e) => console.error(`[Song ${song.id}] ❌ Player ERROR:`, e)}
				/>
			</div>

			{/* Custom Controls */}
			<div className="flex items-center gap-3" onClick={stopPropagation}>
				<button
					onClick={handlePlayPause}
					className="p-2 bg-white/10 hover:bg-pink-500/30 rounded-full transition-all flex-shrink-0"
					aria-label={playing ? 'Pause' : 'Play'}
				>
					{playing ? (
						<Pause className="w-5 h-5 text-white" />
					) : (
						<Play className="w-5 h-5 text-white" />
					)}
				</button>

				<input
					type="range"
					min={0}
					max={1}
					step="any"
					value={played}
					onMouseDown={handleSeekMouseDown}
					onChange={handleSeekChange}
					onMouseUp={handleSeekMouseUp}
					className="flex-1"
					style={{ accentColor: '#ec4899' }}
				/>

				{/* --- 2. REMOVE TIME DISPLAY ---
                    The <span> element that showed the time is now removed.
                */}
			</div>
		</div>
	);
};

export default SongItem;
