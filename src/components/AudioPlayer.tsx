import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Settings } from 'lucide-react';
import { AudiobookData, AudioChapter } from '../types';
import { formatDuration } from '../services/ttsService';

interface AudioPlayerProps {
  audiobook: AudiobookData;
  onClose?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audiobook, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentChapter = audiobook.audioChapters[currentChapterIndex];
  const completedChapters = audiobook.audioChapters.filter(ch => ch.status === 'completed');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter?.audioUrl) return;

    audio.src = currentChapter.audioUrl;
    audio.load();

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentChapter.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleNextChapter();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentChapterIndex, currentChapter]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentChapter?.audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handlePreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setIsPlaying(false);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < completedChapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setIsPlaying(false);
    } else {
      // End of audiobook
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleChapterSelect = (index: number) => {
    setCurrentChapterIndex(index);
    setIsPlaying(false);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (completedChapters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <p>No audio chapters available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <audio ref={audioRef} preload="metadata" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Audiobook Player</h3>
            <p className="text-purple-100 text-sm">
              Chapter {currentChapterIndex + 1} of {completedChapters.length}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-purple-100 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Current Chapter Info */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-1">
          {currentChapter?.title || 'Loading...'}
        </h4>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2">
        <div
          ref={progressRef}
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handlePreviousChapter}
            disabled={currentChapterIndex === 0}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-5 h-5 text-gray-700" />
          </button>
          
          <button
            onClick={handlePlayPause}
            disabled={!currentChapter?.audioUrl}
            className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          
          <button
            onClick={handleStop}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Square className="w-5 h-5 text-gray-700" />
          </button>
          
          <button
            onClick={handleNextChapter}
            disabled={currentChapterIndex >= completedChapters.length - 1}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Playback Speed</label>
              <span className="text-sm text-gray-500">{playbackRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Chapter List */}
      <div className="border-t border-gray-200">
        <div className="p-4">
          <h5 className="font-medium text-gray-900 mb-3">Chapters</h5>
          <div className="max-h-48 overflow-y-auto">
            {completedChapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => handleChapterSelect(index)}
                className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                  index === currentChapterIndex
                    ? 'bg-purple-100 text-purple-900'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {index + 1}. {chapter.title}
                  </span>
                  {chapter.duration && (
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDuration(chapter.duration)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
