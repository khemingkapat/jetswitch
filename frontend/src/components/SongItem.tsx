import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { ThumbsUp, ThumbsDown, Play, Pause } from 'lucide-react';

interface Song {
	id: number;
	title: string;
	artist_name: string;
	score: number;
	url: string;
}

interface SongItemProps {
	song: Song;
	onThumbsUp?: (id: number) => void;
	onThumbsDown?: (id: number) => void;
}

const SongItem: React.FC<SongItemProps> = ({ song, onThumbsUp, onThumbsDown }) => {
	// --- Diagnostic Logs ---
	console.log(`[Song ${song.id}] Rendered. URL: ${song.url}`);

	useEffect(() => {
		console.log(`[Song ${song.id}] MOUNTED with URL: ${song.url}`);
	}, [song.id, song.url]);

	const [playing, setPlaying] = useState(false);
	const [played, setPlayed] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [duration, setDuration] = useState(0);
	const playerRef = useRef<ReactPlayer>(null);

	const handlePlayPause = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPlaying((prev) => {
			const next = !prev;
			console.log(`[Song ${song.id}] Play/Pause clicked. Now playing = ${next}`);
			if (next) console.log(`[Song ${song.id}] ▶️ Now playing: ${song.url}`);
			return next;
		});
	};

	const handleDuration = (duration: number) => {
		console.log(`[Song ${song.id}] DURATION LOADED: ${duration}s`);
		setDuration(duration);
	};

	const handleProgress = (state: { played: number }) => {
		if (!seeking) {
			setPlayed(state.played);
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
		if (playerRef.current) {
			const newPlayedValue = parseFloat((e.target as HTMLInputElement).value);
			console.log(`[Song ${song.id}] Seek to: ${newPlayedValue}`);
			playerRef.current.seekTo(newPlayedValue);
		}
	};

	const stopPropagation = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	const formatTime = (seconds: number) => {
		if (isNaN(seconds) || seconds === 0) return '0:00';
		const date = new Date(seconds * 1000);
		const ss = date.getUTCSeconds().toString().padStart(2, '0');
		const mm = date.getUTCMinutes().toString().padStart(2, '0');
		const hh = date.getUTCHours();
		return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
	};

	return (
		<div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-all">
			{/* Top section */}
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

			{/* Player */}
			<div className="mb-3" onClick={stopPropagation}>
				<ReactPlayer
					ref={playerRef}
					src={song.url}          // ✅ use url, not src
					playing={playing}
					muted={!playing}
					controls={false}        // hide YouTube controls if you want your custom slider
					width="0"
					height="0"
					onPlay={() => {
						console.log(`[Song ${song.id}] ▶️ onPlay — Now playing: ${song.url}`);
						setPlaying(true);
					}}
					onPause={() => {
						console.log(`[Song ${song.id}] ⏸️ onPause`);
						setPlaying(false);
					}}
					onDuration={handleDuration}
					onProgress={handleProgress}
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

				<span className="text-white/70 text-sm font-mono w-24 text-right">
					{formatTime(played * duration)} / {formatTime(duration)}
				</span>
			</div>
		</div>
	);
};

export default SongItem;

