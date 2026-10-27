import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, Upload, RotateCcw, Check, Music2, Disc3, Sparkles } from 'lucide-react';
import { audioService, BaseTrackInfo } from '../utils/audio';

interface BaseAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BaseAudioModal: React.FC<BaseAudioModalProps> = ({ isOpen, onClose }) => {
  const [trackInfo, setTrackInfo] = useState<BaseTrackInfo>(() => audioService.getBaseAudioInfo());
  const [volume, setVolume] = useState<number>(() => audioService.getBaseAudioInfo().volume);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = audioService.subscribeBaseAudio((info) => {
      setTrackInfo(info);
      setVolume(info.volume);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await audioService.loadCustomBaseAudio(file);
      setUploadSuccess(true);
      audioService.playUiBlip();
      setTimeout(() => setUploadSuccess(false), 2600);
    } catch (err) {
      console.error('Failed to load audio:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetDefault = async () => {
    audioService.playUiBlip();
    await audioService.resetDefaultBaseAudio();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioService.setBaseAudioVolume(val);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#13141b] border border-[#262732] rounded-2xl shadow-2xl flex flex-col text-[#f3f4f6] overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#0b0c10] border-b border-[#262732] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#c084fc] flex items-center justify-center">
              <Disc3 className="w-4 h-4 animate-spin [animation-duration:8s]" />
            </div>
            <div>
              <h2 className="font-futuristic font-bold text-base text-[#f3f4f6]">
                Base Website Audio Soundtrack
              </h2>
              <p className="text-xs text-[#9ca3af]">
                Plays when "Sound on" is clicked in the header
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close base audio modal"
            className="p-1.5 rounded-full text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          
          {/* Active Track Card */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c084fc] font-semibold uppercase tracking-wider font-tech">
                Active Soundtrack
              </span>
              <span
                className={`flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full ${
                  trackInfo.isPlaying
                    ? 'bg-[#a855f7]/20 text-purple-300 border border-[#a855f7]/40'
                    : 'bg-[#1a1b24] text-[#9ca3af]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    trackInfo.isPlaying ? 'bg-[#a855f7] animate-pulse' : 'bg-[#9ca3af]'
                  }`}
                />
                <span>{trackInfo.isPlaying ? 'Playing Now' : 'Sound is Off'}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-[#13141b] border border-[#262732] flex items-center justify-center text-[#c084fc] shrink-0">
                <Music2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-futuristic text-sm font-bold text-[#f3f4f6] truncate">
                  {trackInfo.trackName}
                </h3>
                <p className="text-xs text-[#9ca3af] flex items-center gap-2 mt-0.5 font-tech">
                  <span>{trackInfo.isCustom ? 'Custom Uploaded Audio' : 'Synthesized Cyber Soundtrack'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Seamless Loop</span>
                </p>
              </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-[#9ca3af] pt-1 leading-relaxed border-t border-[#262732]/70">
              Controlled by the <strong className="text-white">Sound on / Sound off</strong> button in the top navigation bar. When active, all website waveform visualizers dance to its frequency spectrum!
            </p>
          </div>

          {/* Upload New Track Area */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#c084fc] uppercase tracking-wider">
              Change / Upload Base Audio
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
              onChange={handleFileSelected}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full p-6 rounded-xl border border-dashed border-[#a855f7]/50 hover:border-[#a855f7] bg-[#1a1b24]/40 hover:bg-[#1a1b24] transition-all flex flex-col items-center justify-center gap-2 group text-center cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#a855f7]/15 group-hover:bg-[#a855f7]/25 text-[#c084fc] flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <span className="font-futuristic text-sm font-semibold text-[#f3f4f6] group-hover:text-[#c084fc] transition-colors block">
                  {isUploading ? 'Loading Audio File...' : 'Upload Base Audio Track'}
                </span>
                <span className="text-xs text-[#9ca3af] mt-0.5 block">
                  Supports MP3, WAV, M4A, OGG, FLAC. Stored securely in your browser.
                </span>
              </div>
            </button>

            {uploadSuccess && (
              <div className="p-3 rounded-lg bg-[#a855f7]/15 border border-[#a855f7]/40 text-purple-200 text-xs flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-purple-300 shrink-0" />
                <span>Base audio track updated successfully! Toggle "Sound on" to listen.</span>
              </div>
            )}
          </div>

          {/* Volume Control Slider */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#9ca3af] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>Soundtrack Master Volume</span>
              </span>
              <span className="font-tech text-[#c084fc] font-bold">
                {Math.round(volume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-[#a855f7] cursor-pointer"
            />
          </div>

          {/* Reset to Default Button */}
          {trackInfo.isCustom && (
            <div className="flex justify-end">
              <button
                onClick={handleResetDefault}
                className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24] px-3 py-1.5 rounded-lg border border-[#262732] transition-colors"
                title="Restore original base soundtrack"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Default Soundtrack</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0b0c10] border-t border-[#262732] flex items-center justify-between text-xs text-[#9ca3af]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Interactive Web Audio Pipeline</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#a855f7] text-[#0b0c10] font-semibold hover:bg-[#9333ea] transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
