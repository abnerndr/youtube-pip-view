import {
  ExternalLink,
  Gauge,
  ListOrdered,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  SkipBack,
  SkipForward,
  Subtitles,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { QueueState } from "../../types";
import { PLAYER_STATE } from "../player/types";
import type { PlayerFacade } from "../player/types";
import { shortcutOpenLink } from "../platform";
import { strings } from "../strings";

const SEEK_STEP = 10;

const QUALITY_LABELS: Record<string, string> = {
  auto: strings.controls.qualityAuto,
  highres: "4K",
  hd2160: "2160p",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
};

function qualityLabel(level: string): string {
  return QUALITY_LABELS[level] ?? level;
}

interface VideoControlsProps {
  player: PlayerFacade | null;
  videoId: string | null;
  showControls?: boolean;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMutedChange: (muted: boolean) => void;
  onOpenQueue: () => void;
  onChangeVideo: () => void;
  onOpenInYouTube: () => void;
  /** Avisa o App para não esconder os controles enquanto estão em uso. */
  onInteractingChange: (interacting: boolean) => void;
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoControls({
  player,
  videoId,
  showControls = false,
  volume,
  isMuted,
  onVolumeChange,
  onMutedChange,
  onOpenQueue,
  onChangeVideo,
  onOpenInYouTube,
  onInteractingChange,
}: VideoControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [canGoToPrevious, setCanGoToPrevious] = useState(false);
  const [canGoToNext, setCanGoToNext] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<string[]>([]);
  const [playbackQuality, setPlaybackQuality] = useState("auto");
  const menuRef = useRef<HTMLDivElement>(null);
  const captionsPrefRef = useRef(false);
  const qualityPrefRef = useRef("auto");

  const applyPreferredQuality = (facade: PlayerFacade) => {
    if (!facade.capabilities.quality) return;
    const levels = facade.getAvailableQualityLevels();
    setQualityLevels(levels);
    const preferred = qualityPrefRef.current || "auto";
    const target = levels.includes(preferred)
      ? preferred
      : levels.includes("auto")
        ? "auto"
        : levels[0] || "auto";
    if (target && target !== "auto") {
      facade.setPlaybackQuality(target);
    } else if (target === "auto") {
      facade.setPlaybackQuality("auto");
    }
    setPlaybackQuality(target);
  };

  // Preferência de legendas e qualidade: carregar uma vez e reaplicar no player.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      window.electronAPI?.getStoredCaptions?.() ?? Promise.resolve(false),
      window.electronAPI?.getStoredQuality?.() ?? Promise.resolve("auto"),
    ])
      .then(([enabled, quality]) => {
        if (cancelled) return;
        captionsPrefRef.current = Boolean(enabled);
        setCaptionsOn(Boolean(enabled));
        qualityPrefRef.current = typeof quality === "string" && quality ? quality : "auto";
        setPlaybackQuality(qualityPrefRef.current);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Tempo e duração vêm do player. Nada de estimativa por relógio.
  useEffect(() => {
    if (!player) return;
    return player.onProgress(({ currentTime: time, duration: total }) => {
      setDuration(total);
      if (seekPreview === null) {
        setCurrentTime(time);
      }
      setIsLive(player.isLive());
    });
  }, [player, seekPreview]);

  // Estado real de reprodução: o botão para de mentir quando o autoplay é
  // bloqueado ou quando o vídeo é pausado por fora.
  useEffect(() => {
    if (!player) return;
    setIsPlaying(player.isPlaying());
    setIsLive(player.isLive());
    setPlaybackRate(player.getPlaybackRate());
    applyPreferredQuality(player);

    // Reaplica legendas (o YouTube costuma religá-las ao carregar).
    player.setCaptionsEnabled(captionsPrefRef.current);
    setCaptionsOn(captionsPrefRef.current);

    return player.onStateChange((state) => {
      if (state === PLAYER_STATE.PLAYING || state === PLAYER_STATE.BUFFERING) {
        setIsPlaying(true);
      } else if (
        state === PLAYER_STATE.PAUSED ||
        state === PLAYER_STATE.ENDED ||
        state === PLAYER_STATE.UNSTARTED ||
        state === PLAYER_STATE.CUED
      ) {
        setIsPlaying(false);
      }

      if (state === PLAYER_STATE.PLAYING) {
        setPlaybackRate(player.getPlaybackRate());
        setIsLive(player.isLive());
        applyPreferredQuality(player);
        // Religa off se a preferência for off (YouTube reinicia CC no play).
        if (!captionsPrefRef.current) {
          player.setCaptionsEnabled(false);
        }
      }
    });
  }, [player]);

  // Trocou de vídeo: zerar o que é do vídeo anterior, manter preferências.
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setSeekPreview(null);
    setCaptionsOn(captionsPrefRef.current);
    setQualityLevels([]);
    setPlaybackQuality(qualityPrefRef.current || "auto");
    setIsLive(false);
  }, [videoId]);

  const resolveCurrentQueueIndex = (queueState: QueueState): number => {
    if (
      queueState.currentIndex >= 0 &&
      queueState.currentIndex < queueState.items.length
    ) {
      const currentItem = queueState.items[queueState.currentIndex];
      if (currentItem?.videoId === videoId) {
        return queueState.currentIndex;
      }
    }

    if (!videoId) return -1;
    return queueState.items.findIndex((item) => item.videoId === videoId);
  };

  const updateQueueNavigationState = (queueState: QueueState) => {
    const currentIndex = resolveCurrentQueueIndex(queueState);
    if (currentIndex === -1) {
      setCanGoToPrevious(false);
      setCanGoToNext(false);
      return;
    }

    setCanGoToPrevious(currentIndex > 0);
    setCanGoToNext(currentIndex < queueState.items.length - 1);
  };

  useEffect(() => {
    if (!window.electronAPI?.getQueue) {
      setCanGoToPrevious(false);
      setCanGoToNext(false);
      return;
    }

    let isMounted = true;

    window.electronAPI
      .getQueue()
      .then((queueState) => {
        if (isMounted) updateQueueNavigationState(queueState);
      })
      .catch(() => {
        if (isMounted) {
          setCanGoToPrevious(false);
          setCanGoToNext(false);
        }
      });

    const cleanup = window.electronAPI.onQueueUpdated?.((queueState) => {
      updateQueueNavigationState(queueState);
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [videoId]);

  // Fechar o menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Enquanto o menu está aberto, os controles não podem sumir por baixo dele.
  useEffect(() => {
    onInteractingChange(menuOpen);
  }, [menuOpen, onInteractingChange]);

  if (!videoId) {
    return null;
  }

  const hasDuration = duration > 0;
  const displayTime = seekPreview ?? currentTime;
  const progressPercentage = hasDuration
    ? Math.min(100, (displayTime / duration) * 100)
    : 0;

  const handlePlaylistNavigation = async (direction: "previous" | "next") => {
    if (!window.electronAPI?.getQueue || !window.electronAPI?.playFromQueue) return;

    try {
      const queueState = await window.electronAPI.getQueue();
      const currentIndex = resolveCurrentQueueIndex(queueState);
      if (currentIndex === -1) return;

      const targetIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (targetIndex < 0 || targetIndex >= queueState.items.length) return;

      await window.electronAPI.playFromQueue(targetIndex);
    } catch (error) {
      console.error(
        `Erro ao navegar para o vídeo ${
          direction === "next" ? "seguinte" : "anterior"
        }:`,
        error
      );
    }
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    onMutedChange(next);
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    onVolumeChange(newVolume);
    if (newVolume > 0 && isMuted) {
      onMutedChange(false);
    }
  };

  const handleRateChange = (rate: number) => {
    player?.setPlaybackRate(rate);
    setPlaybackRate(rate);
  };

  const handleCaptionsToggle = () => {
    const next = !captionsOn;
    captionsPrefRef.current = next;
    player?.setCaptionsEnabled(next);
    setCaptionsOn(next);
    window.electronAPI?.saveCaptions?.(next);
  };

  const handleQualityChange = (level: string) => {
    qualityPrefRef.current = level;
    player?.setPlaybackQuality(level);
    setPlaybackQuality(level);
    window.electronAPI?.saveQuality?.(level);
  };

  const handleLiveSync = () => {
    player?.seekToLive();
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume <= 50 ? Volume1 : Volume2;
  const rates = player?.getAvailablePlaybackRates() ?? [0.5, 1, 1.5, 2];

  // Twitch ao vivo não tem para onde arrastar, e só o YouTube expõe
  // velocidade e legendas: o que não existe some da barra.
  const can = player?.capabilities ?? { seek: true, speed: true, captions: true };
  // Dailymotion opera pelos próprios botões: mostrar os nossos seria oferecer
  // controle que não existe. Sobra a navegação da fila e o menu.
  const nativeControls = Boolean(can.nativeControls);
  // Twitch live: sem seek. YouTube live: seek (DVR) + botão AO VIVO.
  const liveWithoutSeek = isLive && !can.seek && !nativeControls;
  const showLiveSync = isLive && can.seek && !nativeControls;
  const canQuality = Boolean(can.quality) && qualityLevels.length > 0;

  return (
    <div className="video-controls-wrapper">
      {/* O hover fica no container, não no wrapper: o wrapper não recebe
          eventos, para não bloquear o clique no vídeo. */}
      <div
        className={`video-controls-container ${
          showControls ? "visible" : "hidden"
        }`}
        onMouseLeave={() => onInteractingChange(menuOpen)}
      >
        <div className="video-progress-container">
          <div className="playback-actions">
            <button
              type="button"
              className="control-button-small queue-nav-button"
              onClick={() => handlePlaylistNavigation("previous")}
              title={strings.controls.previous}
              aria-label={strings.controls.previous}
              disabled={!canGoToPrevious}
            >
              <SkipBack size={14} aria-hidden="true" />
            </button>
            {can.seek && (
            <button
              type="button"
              className="control-button-small seek-button"
              onClick={() => player?.seekBy(-SEEK_STEP)}
              title={strings.controls.rewind(SEEK_STEP)}
              aria-label={strings.controls.rewind(SEEK_STEP)}
            >
              <RotateCcw size={14} aria-hidden="true" />
            </button>
            )}
            {!nativeControls && (
            <button
              type="button"
              className="control-button-small play-pause-button"
              onClick={() => player?.togglePlay()}
              title={isPlaying ? strings.controls.pauseHint : strings.controls.playHint}
              aria-label={isPlaying ? strings.controls.pause : strings.controls.play}
            >
              {isPlaying ? (
                <Pause size={14} aria-hidden="true" />
              ) : (
                <Play size={14} aria-hidden="true" />
              )}
            </button>
            )}
            {can.seek && (
            <button
              type="button"
              className="control-button-small seek-button"
              onClick={() => player?.seekBy(SEEK_STEP)}
              title={strings.controls.forward(SEEK_STEP)}
              aria-label={strings.controls.forward(SEEK_STEP)}
            >
              <RotateCw size={14} aria-hidden="true" />
            </button>
            )}
            <button
              type="button"
              className="control-button-small queue-nav-button"
              onClick={() => handlePlaylistNavigation("next")}
              title={strings.controls.next}
              aria-label={strings.controls.next}
              disabled={!canGoToNext}
            >
              <SkipForward size={14} aria-hidden="true" />
            </button>
          </div>

          {nativeControls ? (
            <span className="video-native-hint">{strings.controls.nativeControls}</span>
          ) : liveWithoutSeek ? (
            <span className="video-live" role="status">
              {strings.controls.live}
            </span>
          ) : (
            <>
          <span className="video-time">{formatTime(displayTime)}</span>

          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercentage}
            disabled={!hasDuration}
            onChange={(e) => {
              if (!hasDuration) return;
              setSeekPreview((parseFloat(e.target.value) / 100) * duration);
            }}
            onMouseUp={() => {
              if (seekPreview !== null) {
                player?.seekTo(seekPreview);
                setCurrentTime(seekPreview);
              }
              setSeekPreview(null);
            }}
            onTouchEnd={() => {
              if (seekPreview !== null) {
                player?.seekTo(seekPreview);
                setCurrentTime(seekPreview);
              }
              setSeekPreview(null);
            }}
            className="video-progress-slider"
            style={{ "--progress": `${progressPercentage}%` } as CSSProperties}
            title={hasDuration ? strings.controls.seekHint : strings.controls.loadingHint}
            aria-label={strings.controls.position}
          />

          {showLiveSync ? (
            <button
              type="button"
              className="video-live video-live-button"
              onClick={handleLiveSync}
              title={strings.controls.liveSync}
              aria-label={strings.controls.liveSync}
            >
              {strings.controls.live}
            </button>
          ) : (
            <span className="video-time">
              {hasDuration ? formatTime(duration) : "--:--"}
            </span>
          )}
            </>
          )}

          {!nativeControls && (
          <div className="volume-control">
            <button
              type="button"
              className="control-button-small volume-button"
              onClick={handleMuteToggle}
              title={isMuted ? strings.controls.unmute : strings.controls.mute}
              aria-label={isMuted ? strings.controls.unmuteAria : strings.controls.muteAria}
            >
              <VolumeIcon size={14} aria-hidden="true" />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeSliderChange}
              className="volume-slider"
              title={strings.controls.volume}
              aria-label={strings.controls.volume}
            />
          </div>
          )}

          <div className="controls-menu" ref={menuRef}>
            <button
              type="button"
              className="control-button-small"
              onClick={() => setMenuOpen((open) => !open)}
              title={strings.controls.more}
              aria-label={strings.controls.more}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal size={14} aria-hidden="true" />
            </button>

            {menuOpen && (
              <div className="controls-menu-panel" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="controls-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenQueue();
                  }}
                >
                  <ListOrdered size={14} aria-hidden="true" />
                  {strings.controls.queue}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="controls-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onChangeVideo();
                  }}
                >
                  <Play size={14} aria-hidden="true" />
                  {strings.controls.changeVideo}
                  <kbd>{shortcutOpenLink()}</kbd>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="controls-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenInYouTube();
                  }}
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  {strings.controls.openOnYouTube}
                </button>

                {(can.captions || can.speed || canQuality) && (
                  <div className="controls-menu-separator" role="separator" />
                )}

                {can.captions && (
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={captionsOn}
                  className={`controls-menu-item ${captionsOn ? "active" : ""}`}
                  onClick={handleCaptionsToggle}
                >
                  <Subtitles size={14} aria-hidden="true" />
                  {strings.controls.captions}
                  <span className="controls-menu-value">
                    {captionsOn ? strings.controls.captionsOn : strings.controls.captionsOff}
                  </span>
                </button>
                )}

                {canQuality && (
                <div className="controls-menu-label">
                  <Settings2 size={14} aria-hidden="true" />
                  {strings.controls.quality}
                </div>
                )}
                {canQuality && (
                <div className="controls-menu-rates">
                  {qualityLevels.map((level) => (
                    <button
                      type="button"
                      key={level}
                      className={`rate-button ${
                        playbackQuality === level ? "active" : ""
                      }`}
                      onClick={() => handleQualityChange(level)}
                      aria-pressed={playbackQuality === level}
                    >
                      {qualityLabel(level)}
                    </button>
                  ))}
                </div>
                )}

                {can.speed && (
                <div className="controls-menu-label">
                  <Gauge size={14} aria-hidden="true" />
                  {strings.controls.speed}
                </div>
                )}
                {can.speed && (
                <div className="controls-menu-rates">
                  {rates.map((rate) => (
                    <button
                      type="button"
                      key={rate}
                      className={`rate-button ${
                        Math.abs(rate - playbackRate) < 0.01 ? "active" : ""
                      }`}
                      onClick={() => handleRateChange(rate)}
                      aria-pressed={Math.abs(rate - playbackRate) < 0.01}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
