"use client";
import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface MinimalVideoPlayerProps {
  src: string;
  className?: string;
}

const MinimalVideoPlayer: React.FC<MinimalVideoPlayerProps> = ({ 
  src, 
  className = "" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newRate = parseFloat(e.target.value);
    video.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || isDragging) return;
    
    setCurrentTime(video.currentTime);
  }, [isDragging]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    setDuration(video.duration);
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdateEvent = () => handleTimeUpdate();
    const handleLoadedMetadataEvent = () => handleLoadedMetadata();

    video.addEventListener('timeupdate', handleTimeUpdateEvent);
    video.addEventListener('loadedmetadata', handleLoadedMetadataEvent);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdateEvent);
      video.removeEventListener('loadedmetadata', handleLoadedMetadataEvent);
    };
  }, [handleTimeUpdate, handleLoadedMetadata]);

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        key={src}
        ref={videoRef}
        src={src}
        className="w-full h-auto max-h-[500px] object-contain rounded-lg"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        muted
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300">
          <button
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all duration-200 hover:scale-110"
          >
            <PlayIcon className="w-12 h-12" />
          </button>
        </div>
      )}

      {/* Minimal Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="mb-3">
          <div 
            className="w-full h-1 bg-white/30 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-[#0BC0DF] rounded-full transition-all duration-150 group-hover:h-1.5"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/80 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#0BC0DF] transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
            </button>

            {/* Sound */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-[#0BC0DF] transition-colors"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-5 h-5" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={handleSpeedChange}
              className="bg-black/50 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-[#0BC0DF]"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-[#0BC0DF] transition-colors"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MinimalVideoPlayer);
