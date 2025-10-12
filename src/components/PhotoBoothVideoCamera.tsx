/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { useAppStore, useSettingsStore } from '../app/store.ts';
import { ReactComponent as CameraIcon } from '../assets/camera-icon.svg';
import '../styles/boothCamera.css';

type ModalImage = { largeUrl: string; alt: string };
type Constraints = MediaStreamConstraints;

export default function PhotoBoothVideoCamera() {
  /* ---------------- Refs ---------------- */
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const composeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ---------------- Stores ---------------- */
  const filter = useSettingsStore((s) => s.selectedFilter);
  const shotsNum = useSettingsStore((s) => s.shotsNum);
  const selectedColor = useSettingsStore((s) => s.selectedColor);
  const selectedTextColor = useSettingsStore((s) => s.selectedTextColor);
  const text = useSettingsStore((s) => s.text);
  const textDirection = useSettingsStore((s) => s.textDirection);
  const enterBooth = useAppStore((s) => s.enterBooth);

  /* ---------------- UI state ---------------- */
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [finalStrip, setFinalStrip] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<ModalImage | null>(null);

  /* ---------------- Utilities ---------------- */
  const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

  function waitForVideoMounted(): Promise<HTMLVideoElement> {
    return new Promise((resolve) => {
      if (videoRef.current) return resolve(videoRef.current);
      // allow React to mount the node next frame
      requestAnimationFrame(() => resolve(videoRef.current!));
    });
  }

  function waitForVideoReady(v: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      if (v.readyState >= 2) return resolve(); // HAVE_CURRENT_DATA
      const done = () => {
        v.removeEventListener('loadedmetadata', done);
        v.removeEventListener('canplay', done);
        resolve();
      };
      v.addEventListener('loadedmetadata', done, { once: true });
      v.addEventListener('canplay', done, { once: true });
    });
  }

  /* ---------------- Canvas sizing on metadata ---------------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    function handleLoadedMeta() {
      const width = v?.videoWidth || 1280;
      const height = v?.videoHeight || 720;

      const frame = frameCanvasRef.current;
      if (frame) {
        frame.width = width;
        frame.height = height;
      }
      const comp = composeCanvasRef.current;
      if (comp) {
        comp.width = width;
        comp.height = height * shotsNum + 20 * (shotsNum - 1);
      }
    }

    v.addEventListener('loadedmetadata', handleLoadedMeta);
    return () => v.removeEventListener('loadedmetadata', handleLoadedMeta);
  }, [shotsNum]);

  /* ---------------- Camera start/stop ---------------- */
  async function startCamera() {
    setError(null);
    setVideoReady(false);
    setIsLoadingCamera(true);

    try {
      if (!streamRef.current) {
        streamRef.current = await getUserMediaSafe({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      }

      const v = await waitForVideoMounted();
      v.srcObject = streamRef.current!;
      v.muted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', 'true');

      try {
        await v.play();
      } catch {
        // some mobile browsers need an extra tap; ignore
      }

      await waitForVideoReady(v);
      setVideoReady(true);
    } catch (e: any) {
      setError(e?.message || 'Unable to access camera');
      // make sure we don’t think it’s ready
      setVideoReady(false);
    } finally {
      setIsLoadingCamera(false);
    }
  }

  function stopCamera() {
    const video = videoRef.current;
    const stream = streamRef.current;

    try {
      if (stream) {
        stream.getTracks().forEach((t) => {
          try { t.stop(); } catch (err){console.error(err);}
          try { stream.removeTrack(t); } catch (err){console.error(err);}
        });
        streamRef.current = null;
      }
    } finally {
      if (video) {
        try { video.pause(); } catch (err) {console.error(err);}
        (video as any).srcObject = null;
        try { video.load(); } catch (err) {console.error(err);}
      }
      setVideoReady(false);
    }
  }

  /* ---------------- Capture ---------------- */
  async function drawFrameToCanvasSafely(): Promise<string | null> {
    const v = await waitForVideoMounted();
    await waitForVideoReady(v);
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const frameCanvas = frameCanvasRef.current!;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    frameCanvas.width = w;
    frameCanvas.height = h;

    const ctx = frameCanvas.getContext('2d')!;
    ctx.save();
    ctx.filter = filter === 'blackwhite' ? 'grayscale(1)' : 'none';
    ctx.drawImage(v, 0, 0, w, h);
    ctx.restore();

    return frameCanvas.toDataURL('image/png');
  }

  async function runCountdownCapture() {
    if (!streamRef.current) {
      setError('Start the camera first.');
      return;
    }
    if (isCapturing) return;

    setIsCapturing(true);
    setError(null);

    // 3 → 2 → 1
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await sleep(1000);
    }
    setCountdown(0); // keep 0 visible during the snap

    const data = await drawFrameToCanvasSafely();

    setCountdown(null); // hide overlay

    if (data) {
      setShots((prev) => {
        const next = [...prev, data].slice(0, shotsNum);
        if (next.length === Number(shotsNum)) composeStrip(next);
        return next;
      });
    }

    setIsCapturing(false);
  }

  async function takeMultiplePicturesAtOnce() {
    // Start camera on first click if needed
    if (!videoReady) {
      await startCamera();
      if (!videoReady) return; // still not ready; bail
    }

    // reset
    setShots([]);
    setFinalStrip(null);
    setError(null);

    const INTER_SHOT_PAUSE_MS = 600;
    for (let i = 0; i < shotsNum; i++) {
      await runCountdownCapture();
      if (i < shotsNum - 1) await sleep(INTER_SHOT_PAUSE_MS);
    }
  }

  /* ---------------- Compose strip ---------------- */
  function composeStrip(images: string[]) {
    const frameCanvas = frameCanvasRef.current;
    const composeCanvas = composeCanvasRef.current;
    if (!frameCanvas || !composeCanvas) return;

    const width = frameCanvas.width;
    const singleHeight = frameCanvas.height;

    const headerOrTopSpace = 72;
    const innerPadding = 10;
    const borderStroke = 34;

    const totalHeight = headerOrTopSpace + images.length * singleHeight + innerPadding * 2;
    composeCanvas.width = width + innerPadding * 2;
    composeCanvas.height = totalHeight;

    const ctx = composeCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, composeCanvas.width, composeCanvas.height);

    ctx.fillStyle = selectedColor;
    ctx.fillRect(
      innerPadding,
      innerPadding,
      composeCanvas.width - 2 * innerPadding,
      composeCanvas.height - 2 * innerPadding
    );

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = borderStroke;
    ctx.strokeRect(0, 0, composeCanvas.width, composeCanvas.height);

    if (text && text.length) {
      ctx.fillStyle = selectedTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 28px Helvetica, Roboto, Arial';
      if (textDirection === 'top') {
        ctx.fillText(text, composeCanvas.width / 2, innerPadding + headerOrTopSpace / 2);
      } else if (textDirection === 'bottom') {
        ctx.fillText(text, composeCanvas.width / 2, composeCanvas.height - innerPadding - headerOrTopSpace / 2);
      }
    }

    let loaded = 0;
    images.forEach((data, idx) => {
      const img = new Image();
      img.onload = () => {
        const x = innerPadding;
        const y =
          textDirection === 'bottom'
            ? innerPadding + idx * singleHeight
            : innerPadding + headerOrTopSpace + idx * singleHeight;

        ctx.save();
        ctx.filter = filter === 'blackwhite' ? 'grayscale(1)' : 'none';
        ctx.drawImage(img, x, y, width, singleHeight);
        ctx.restore();

        loaded++;
        if (loaded === images.length) {
          setFinalStrip(composeCanvas.toDataURL('image/png'));
          stopCamera();
        }
      };
      img.src = data;
    });
  }

  /* ---------------- Modal/Download/Back ---------------- */
  function download(dataUrl: string) {
    const filename = `strip-${shots.length}-${Date.now()}.png`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const openModal = (image: ModalImage) => setModalImage(image);

  function backToSettings() {
    stopCamera();
    requestAnimationFrame(() => enterBooth());
    setShots([]);
    setFinalStrip(null);
    setError(null);
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  /* ---------------- getUserMedia (safe) ---------------- */
  function legacyGetUserMedia(constraints: Constraints): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      const gum =
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia;
      if (!gum) return reject(new Error('getUserMedia not supported'));
      gum.call(navigator, constraints, resolve, reject);
    });
  }

  async function getUserMediaSafe(constraints: Constraints): Promise<MediaStream> {
    if (typeof window === 'undefined') throw new Error('Window not available (SSR/Pre-render).');
    if (!('isSecureContext' in window) || !window.isSecureContext) throw new Error('HTTPS required for camera.');
    const md = (navigator as any).mediaDevices;
    if (md && typeof md.getUserMedia === 'function') return md.getUserMedia(constraints);
    return legacyGetUserMedia(constraints);
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="photobooth-center">
      <p className="settings-btn" onClick={backToSettings}>Back to Settings</p>

      {error && <p className="error">{error}</p>}

      <div className="photobooth-center-btn">
        {videoReady && <button
          className="btn camera"
          onClick={takeMultiplePicturesAtOnce}
          disabled={!videoReady || isLoadingCamera || isCapturing}
          aria-label="Take photos"
          title={!videoReady ? 'Starting camera… (tap once to allow)' : 'Take photos'}
        >
          <CameraIcon />
        </button>
        }
        {!videoReady && !isLoadingCamera && (
          <button
            className="btn"
            onClick={startCamera}
            aria-label="Start camera"
            title="Start camera"
            style={{ marginLeft: 12 }}
          >
            Start Camera
          </button>
        )}
      </div>

      {/* Always render video so the ref is never null */}
        <div className="video-section">
            <div className="video-wrap">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={() => setVideoReady(true)}
                    onCanPlay={() => setVideoReady(true)}
                    className={filter === 'blackwhite' ? 'blackwhite' : ''}
                />
                {isLoadingCamera && (
                    <div className="spinner-container">
                        <div className="spinner-icon"></div>
                    </div>
                )}

                {/* Progress /Countdown overlay */}
                {!isLoadingCamera && countdown !== null && (
                <div className="countdown-section">
                    <span className="count">{shots.length+1}/{shotsNum}</span>
                </div>
                )}

                {/* Circular countdown */}
                {countdown !== null && (
                <div className="spinner-container">
                    <div className="spinner-container-countdown">
                    <svg className="spinner-countdown" viewBox="0 0 100 100" fill="white">
                        <circle cx="50" cy="50" r="45"></circle>
                        <path className="spinner-path" d="M 50,5 A 45,45 0 1,1 50,95 A 45,45 0 1,1 50,5"></path>
                    </svg>
                    <div className="spinner-text">{countdown}</div>
                    </div>
                </div>
                )}
            </div>
        </div>

      {!finalStrip && shots.length > 0 && (
        <div className="shots">
          {shots.map((s, i) => (
            <img key={i} src={s} alt={`Shot ${i + 1}`} className="thumb" />
          ))}
        </div>
      )}

      {finalStrip && (
        <>
          <div className="photobooth-center-btn">
            <button className="btn" onClick={() => download(finalStrip!)} disabled={!finalStrip}>
              Download Strip
            </button>
          </div>

          <section className="mt-6">
            <h2 className="text-lg font-medium mb-2">Final Strip Preview</h2>
            <img
              src={finalStrip!}
              alt="Photo strip"
              className="final-strip"
              onClick={() => openModal({ largeUrl: finalStrip!, alt: 'Photo strip' })}
            />
          </section>
        </>
      )}

      {modalImage && <Modal src={modalImage.largeUrl} alt={modalImage.alt} onClose={() => setModalImage(null)} />}

      {/* Hidden canvases */}
      <div className="hidden-canvases">
        <canvas ref={frameCanvasRef} />
        <canvas ref={composeCanvasRef} />
      </div>
    </div>
  );
}
