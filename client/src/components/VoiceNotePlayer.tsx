import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type ChatTheme = "dark" | "light";

/** Convert Google Drive view URL to a proxied stream URL via our server */
function getStreamUrl(driveUrl: string): string {
    const match = driveUrl.match(/\/file\/d\/([^/\s]+)\//);
    if (!match) return driveUrl;
    return `/api/audio-proxy?id=${match[1]}`;
}

/** Format seconds to mm:ss */
function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// Waveform bar heights (static pattern to look natural)
const WAVE_BARS = [0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.4, 0.7, 0.3, 0.6, 0.8, 0.5, 0.7, 0.4, 0.9, 0.3, 0.6, 0.5, 0.8, 0.4, 0.7, 0.6, 0.3, 0.9, 0.5, 0.7, 0.4, 0.8, 0.6, 0.3];

export function VoiceNotePlayer({ url, theme }: { url: string; theme: ChatTheme }) {
    const isDark = theme === "dark";
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const animFrameRef = useRef<number>(0);

    const streamUrl = getStreamUrl(url);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Animation frame for progress update
    const updateProgress = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
        if (isPlaying) {
            animFrameRef.current = requestAnimationFrame(updateProgress);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (isPlaying) {
            animFrameRef.current = requestAnimationFrame(updateProgress);
        }
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isPlaying, updateProgress]);

    const initAudio = (): Promise<HTMLAudioElement> => {
        return new Promise((resolve, reject) => {
            if (audioRef.current && isLoaded) {
                resolve(audioRef.current);
                return;
            }
            const audio = audioRef.current || new Audio();
            audioRef.current = audio;

            const onLoaded = () => {
                setDuration(audio.duration);
                setIsLoaded(true);
                audio.removeEventListener("loadedmetadata", onLoaded);
                audio.removeEventListener("error", onErr);
                resolve(audio);
            };
            const onErr = () => {
                audio.removeEventListener("loadedmetadata", onLoaded);
                audio.removeEventListener("error", onErr);
                reject(new Error("Failed to load audio"));
            };
            const onEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };

            audio.addEventListener("loadedmetadata", onLoaded);
            audio.addEventListener("error", onErr);
            audio.addEventListener("ended", onEnded);
            audio.src = streamUrl;
            audio.load();
        });
    };

    const togglePlay = async () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        setIsLoadingAudio(true);
        setError(false);
        try {
            const audio = await initAudio();
            await audio.play();
            setIsPlaying(true);
        } catch {
            setError(true);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        // RTL: progress goes right-to-left
        const clickX = e.clientX - rect.left;
        const ratio = clickX / rect.width;
        const newTime = ratio * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 min-w-[240px] max-w-[320px] select-none ${isDark
                ? "bg-gradient-to-l from-cyan-500/[0.08] to-blue-600/[0.08] border border-cyan-500/15"
                : "bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200/60"
                }${error ? ` ${isDark ? "border-red-500/20" : "border-red-200"}` : ""}`}
        >
            {/* Play/Pause button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                disabled={isLoadingAudio}
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${isDark
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                    : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    } disabled:opacity-60 disabled:cursor-wait`}
            >
                {isLoadingAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                )}
            </motion.button>

            {/* Waveform + progress */}
            <div className="flex-1 flex flex-col gap-1.5">
                {/* Waveform bars as progress */}
                <div
                    className="flex items-center gap-[2px] h-7 cursor-pointer"
                    onClick={handleSeek}
                >
                    {WAVE_BARS.map((height, i) => {
                        const barProgress = (i / WAVE_BARS.length) * 100;
                        const isPast = barProgress <= progress;
                        return (
                            <motion.div
                                key={i}
                                className={`w-[3px] rounded-full transition-colors duration-150 ${isPast
                                    ? isDark
                                        ? "bg-cyan-400"
                                        : "bg-blue-500"
                                    : isDark
                                        ? "bg-white/15"
                                        : "bg-blue-200/60"
                                    }`}
                                style={{ height: `${height * 100}%` }}
                                animate={
                                    isPlaying && isPast
                                        ? {
                                            scaleY: [1, 1.2 + Math.random() * 0.3, 1],
                                        }
                                        : { scaleY: 1 }
                                }
                                transition={
                                    isPlaying && isPast
                                        ? {
                                            duration: 0.4 + Math.random() * 0.3,
                                            repeat: Infinity,
                                            delay: i * 0.02,
                                            ease: "easeInOut",
                                        }
                                        : { duration: 0.2 }
                                }
                            />
                        );
                    })}
                </div>

                {/* Time display */}
                <div className="flex items-center justify-between px-0.5">
                    <span className={`text-[10px] font-mono tabular-nums ${isDark ? "text-white/40" : "text-gray-400"}`}>
                        {formatTime(currentTime)}
                    </span>
                    <span className={`text-[10px] font-mono tabular-nums ${isDark ? "text-white/25" : "text-gray-300"}`}>
                        {isLoaded ? formatTime(duration) : "—:——"}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

/** Regex to match Google Drive file URLs */
export const GOOGLE_DRIVE_VOICE_REGEX = /https?:\/\/drive\.google\.com\/file\/d\/[^\s/]+\/(?:view|preview)(?:\?[^\s]*)?/gi;

/** Check if a URL is a Google Drive voice/file link */
export function isGoogleDriveVoiceUrl(url: string): boolean {
    return /^https?:\/\/drive\.google\.com\/file\/d\/[^\s/]+\/(?:view|preview)/i.test(url);
}

/**
 * Split message content into ordered segments of text and voice.
 * Returns: [{ type: "text"|"voice", content: string }, ...]
 */
export function parseMessageContent(text: string): Array<{ type: "text" | "voice"; content: string }> {
    const segments: Array<{ type: "text" | "voice"; content: string }> = [];
    const regex = new RegExp(GOOGLE_DRIVE_VOICE_REGEX.source, "gi");
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        // Text before this voice link
        const textBefore = text.slice(lastIndex, match.index).trim();
        if (textBefore) {
            segments.push({ type: "text", content: textBefore });
        }
        // Voice link
        segments.push({ type: "voice", content: match[0] });
        lastIndex = regex.lastIndex;
    }

    // Remaining text after last voice link
    const remaining = text.slice(lastIndex).trim();
    if (remaining) {
        segments.push({ type: "text", content: remaining });
    }

    // If no voice links found, return single text segment
    if (segments.length === 0) {
        segments.push({ type: "text", content: text });
    }

    return segments;
}
