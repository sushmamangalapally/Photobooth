import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { useAppStore, useSettingsStore } from "../app/store.ts";
import {ReactComponent as CameraIcon} from '../assets/camera-icon.svg'
import '../styles/boothCamera.css';

type ModalImage = { largeUrl: string; alt: string } | null;

export default function PhotoBoothVideoCamera() {
    // Refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    // visible preview capture
    const frameCanvasRef = useRef<HTMLCanvasElement | null>(null); 
    // offscreen composition
    const composeCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Stores
    const filter = useSettingsStore((s) => s.selectedFilter);
    const shotsNum = useSettingsStore((s) => s.shotsNum);
    const selectedColor = useSettingsStore((s) => s.selectedColor);
    const selectedTextColor = useSettingsStore((s) => s.selectedTextColor);
    const text = useSettingsStore((s) => s.text);
    const textDirection = useSettingsStore((s) => s.textDirection);
    const enterBooth = useAppStore((s) => s.enterBooth);
  
    // UI/logic state
    const [error, setError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState<boolean | null>(false);
    const [isCameraOn, setIsCameraOn] = useState<boolean | null>(false);
    const [isLoadingCamera, setIsLoadingCamera] = useState<boolean | null>(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [shots, setShots] = useState<string[]>([]);
    const [finalStrip, setFinalStrip] = useState<string | null>(null);
    const [modalImage, setModalImage] = useState(null);
    const [stripComplete, setStripComplete] = useState<boolean | null>(null);

    /* ---------------- Camera lifecycle ---------------- */

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return;
        }

        function handleLoadedMeta() {
            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;

            const frameCanvas = frameCanvasRef.current;
            if (frameCanvas) {
                frameCanvas.width = width;
                frameCanvas.height = height;
            }
            const composeCanvas = composeCanvasRef.current;
            if (composeCanvas) {
                composeCanvas.width = width;
                // Make room for gutters
                composeCanvas.height = height * shotsNum + 20 * (shotsNum - 1); 
            }
        }

        video.addEventListener("loadedmetadata", handleLoadedMeta);

        return () => video.removeEventListener("loadedmetadata", handleLoadedMeta);
    }, [shotsNum]);


    async function startCamera() {
        try {
            setError(null);
            setIsLoadingCamera(true);
            // If we already have a stream, reuse it
            if (!streamRef.current) {
                const ms = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user",
                    },
                });
                streamRef.current = ms;
            }

            // Attach to <video> if present
            if (videoRef.current && streamRef.current) {
                const video = videoRef.current;
                video.srcObject = streamRef.current;
                video.setAttribute("playsinline", "true"); // iOS Safari
            }
            setIsCameraOn(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Unable to access camera");
            setIsCameraOn(false);
        } finally {
            setIsLoadingCamera(false);
        }
    }

    function stopCamera() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        const video = videoRef.current;
        if (video) {
            v.srcObject = null;
        }
        setIsCameraOn(false);
    }

    useEffect(() => {
        // Auto-start on mount; stop on unmount
        startCamera();
        return () => stopCamera();
    }, []);

     /* ---------------- Capture & compose ---------------- */

    const  sleep = (ms: number) => {
        return new Promise((res) => setTimeout(res, ms));
    }

    function drawFrameToCanvas(): string | null {
        const video = videoRef.current;
        const frameCanvas = frameCanvasRef.current;
        if (!video || !frameCanvas) {
            return null;
        }

        const ctx = frameCanvas.getContext("2d");
        if (!ctx) {
            return null;
        }

        const w = frameCanvas.width || video.videoWidth;
        const h = frameCanvas.height || video.videoHeight;

        ctx.save();
        ctx.filter = filter === "blackwhite" ? "grayscale(1)" : "none";
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();

        return frameCanvas.toDataURL("image/png");
    }
    async function runCountdownCapture() {
        if (!streamRef.current) {
            setError("Start the camera first.");
            return;
        }
        if (isCapturing){
            return;
        }

        setIsCapturing(true);
        setError(null);

        // 3-2-1 countdown
        for (let i = 3; i >= 1; i--) {
            setCountdown(i);
            await sleep(800);
        }
        setCountdown(null);

        const data = drawFrameToCanvas();
        if (data) {
            setShots((prev) => {
                const next = [...prev, data].slice(0, shotsNum);
                if (next.length === Number(shotsNum)) {
                    // Compose the strip automatically when we reach target number of shots
                    composeStrip(next);
                }
                return next;
            });
        }

        setIsCapturing(false);
    }

    async function takeMultiplePicturesAtOnce() {
        if (stripComplete) {
            startCamera();
        }
        setShots([]);
        setFinalStrip(null);
        setStripComplete(null);
        setError(null);

        if (!isCameraOn) {
            await startCamera();
        }

        for (let i = 0; i < shotsNum; i++) {
            await runCountdownCapture();
            if (i < shotsNum - 1) {
                await sleep(4000);
            }
        }
    }


    function composeStrip(images: string[]) {
        const frameCanvas = frameCanvasRef.current;
        const composeCanvas = composeCanvasRef.current;
        if (!frameCanvas || !composeCanvas) {
            return;
        }

        const width = frameCanvas.width;        // width of each photo
        const singleHeight = frameCanvas.height; // height of each photo

        // Layout constants
        const headerOrTopSpace = 72; // space for the title
        const innerPadding = 10;    // inner padding
        const borderStroke = 34;    // border stroke

        // Canvas size = (left+right mat) + header + stacked photos + (top+bottom mat)
        const totalHeight = headerOrTopSpace + images.length * singleHeight + innerPadding * 2;
        composeCanvas.width = width + innerPadding * 2;
        composeCanvas.height = totalHeight;

        const ctx = composeCanvas.getContext("2d");
        if (!ctx) {
            return;
        }

        // ---- background + mat + border ----
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, composeCanvas.width, composeCanvas.height);

        // inner fill (mat)
        ctx.fillStyle = selectedColor;
        ctx.fillRect(innerPadding, innerPadding, composeCanvas.width - 2 * innerPadding, composeCanvas.height - 2 * innerPadding);

        // thick outer border
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = borderStroke;
        ctx.strokeRect(0, 0, composeCanvas.width, composeCanvas.height);

        // ---- title (centered in header band) ----
        if (text && text.length) {
            ctx.fillStyle = selectedTextColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "600 28px Helvetica, Roboto, Arial";
            if (textDirection === 'top')  {
                ctx.fillText(text, composeCanvas.width / 2, innerPadding + headerOrTopSpace / 2);
                
            } else if (textDirection === 'bottom')  {
                ctx.fillText(text, composeCanvas.width / 2, composeCanvas.height - innerPadding - headerOrTopSpace / 2);

            }
        }

        // ---- draw photos stacked with no gaps ----
        let loaded = 0;
        images.forEach((data, idx) => {
            const img = new Image();
            img.onload = () => {
                const x = innerPadding; // align with inner fill
                const y = textDirection === 'bottom' ? innerPadding + idx * singleHeight : innerPadding + headerOrTopSpace + idx * singleHeight; // edge-to-edge stacking

                ctx.save();
                // apply filter ONLY to the photo
                ctx.filter = filter === "blackwhite" ? "grayscale(1)" : "none";

                ctx.drawImage(img, x, y, width, singleHeight);
                ctx.restore();

                loaded++;
                if (loaded === images.length) {
                    setFinalStrip(composeCanvas.toDataURL("image/png"));
                    setStripComplete(true);
                    stopCamera();
                }
            };
            img.src = data;
        });
    }

    /* ---------------- Helpers / UI ---------------- */
    function download(dataUrl: string) {
        const filename = `strip-${shots.length}-${Date.now()}.png`;
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    const openModal = (image: ModalImage) => {
        setModalImage(image);
    };

    const closeModal = () => {
        setModalImage(null);
    };
  

    return (
        <div className="photobooth-center">
            <p className="settings-btn" onClick={enterBooth}>Back to Settings</p>

            {error && <p className="error">{error}</p>}

            <div className="photobooth-center-btn">
                <button
                    className="btn camera"
                    onClick={takeMultiplePicturesAtOnce}
                    disabled={isCapturing || isLoadingCamera}
                >
                    <CameraIcon fill="#fff"/>
                </button>
            </div>

            <div className="video-wrap">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={filter === "blackwhite" ? "blackwhite" : ""}
                />
                {isLoadingCamera && (
                    <div className="spinner-container">
                        <div className="spinner-icon"></div>
                    </div>
                )}

                {/* Progress /Countdown overlay */}
                {!isLoadingCamera && countdown !== null && (
                    <div className="countdown-section">
                        <span className="count"> {shots.length}/{shotsNum} </span>
                    </div>
                )}

                {/* Circular countdown */}
                {countdown !== null && (
                    <div className="spinner-container">
                        <div class="spinner-container-countdown">
                            <svg class="spinner-countdown" viewBox="0 0 100 100" fill="white">
                                <circle cx="50" cy="50" r="45"></circle>
                                <path class="spinner-path" d="M 50,5 A 45,45 0 1,1 50,95 A 45,45 0 1,1 50,5"></path>
                            </svg>
                            <div class="spinner-text">{countdown}</div>
                        </div>
                    </div>
                )}

            </div>

            {!stripComplete && (<div className="photobooth-center-btn">
                <button
                    className="btn"
                    onClick={stopCamera}
                    disabled={isLoadingCamera || isCapturing}
                >
                    Stop Camera
                </button>
            </div>)}
 

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
                        <button
                            className="btn"
                            onClick={() => download(finalStrip, `strip-${shots.length}x.png`)}
                            disabled={!finalStrip}
                        >
                            Download Strip
                        </button>
                    </div>

                    <section className="mt-6">
                        <h2 className="text-lg font-medium mb-2">Final Strip Preview</h2>
                        <img
                            src={finalStrip}
                            alt="Photo strip"
                            className="final-strip"
                            onClick={() => openModal({largeUrl: finalStrip, alt: 'Photo strip'})}
                        />
                    </section>
                </>
            )}

            {modalImage && (
                <Modal
                    src={modalImage.largeUrl}
                    alt={modalImage.alt}
                    onClose={closeModal}
                />
            )}

            {/* Hidden canvases (1: last frame, 2: composition) */}
            <div className="hidden-canvases">
                <canvas ref={frameCanvasRef} />
                <canvas ref={composeCanvasRef} />
            </div>
        </div>
    )
}
