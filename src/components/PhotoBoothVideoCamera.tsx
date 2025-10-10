import { useState, useRef, useEffect } from 'react';
import PhotoBoothSettings from './PhotoBoothSettings'

import { useAppStore, useSettingsStore } from "../app/store.ts";

export default function PhotoBoothVideoCamera({cameraOn, setCameraOn}) {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean | null>(false);
  const [shots, setShots] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timer, setTimer] = useState<boolean | null>(false);

  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null); // visible preview capture
  const composeCanvasRef = useRef<HTMLCanvasElement | null>(null); // offscreen composition
  const [finalStrip, setFinalStrip] = useState<string | null>(null);


    const view = useAppStore((s) => s.view);
    const filter = useSettingsStore((s) => s.selectedFilter);
    const shotsNum = useSettingsStore((s) => s.shotsNum);
    const selectedColor = useSettingsStore((s) => s.selectedColor);
    const selectedTextColor = useSettingsStore((s) => s.selectedTextColor);
    const text = useSettingsStore((s) => s.text);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    function handleLoadedMeta() {
      // Some devices report 0 initially; guard against that
      const w = vid.videoWidth || 1280;
      const h = vid.videoHeight || 720;

      const c1 = frameCanvasRef.current;
      if (c1) {
        c1.width = w;
        c1.height = h;
      }
      const c2 = composeCanvasRef.current;
      if (c2) {
        c2.width = w;
        c2.height = h * shotsNum + 20 * (shotsNum - 1); // room for gutters
      }
    }
    vid.addEventListener("loadedmetadata", handleLoadedMeta);
    return () => vid.removeEventListener("loadedmetadata", handleLoadedMeta);
  }, [shotsNum]);


      async function startCamera() {
    try {
      setError(null);
        // If we already have a stream (e.g., remount), reuse it
        if (!streamRef.current) {
          const ms = await navigator.mediaDevices.getUserMedia({
            audio: false, // request mic only if you need it
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
          });
        //   if (stopped) return;
          streamRef.current = ms;
        }

        // Attach to <video> if present
        if (videoRef.current && streamRef.current) {
          const v = videoRef.current;
          v.srcObject = streamRef.current;
          v.setAttribute("playsinline", "true"); // iOS Safari
          try {
            await v.play(); // may require a user gesture on iOS
          } catch (e) {
            // If autoplay is blocked, button press later will succeed
          }
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Unable to access camera");
      }
  }

    function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

    function drawFrameToCanvas(): string | null {
        console.log('drawFrameToCanvas')
    const vid = videoRef.current;
    const canvas = frameCanvasRef.current;
    console.log(vid)
    console.log(canvas)
    if (!vid || !canvas) return null;

    console.log(vid)
    console.log(canvas)

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const w = canvas.width || vid.videoWidth;
    const h = canvas.height || vid.videoHeight;

    // Mirror when using front camera for a more natural selfie preview
    // const shouldMirror = facingMode === "user";

    // if (shouldMirror) {
    //   ctx.save();
    //   ctx.translate(w, 0);
    //   ctx.scale(-1, 1);
    //   ctx.drawImage(vid, 0, 0, w, h);
    //   ctx.restore();
    // } else {
    //   ctx.drawImage(vid, 0, 0, w, h);
    // }


    console.log('filter')
    console.log(filter)
    if (filter === 'blackwhite') {
        ctx.filter = 'grayscale(1)';
    }


    ctx.drawImage(vid, 0, 0, w, h);

    return canvas.toDataURL("image/png");
  }

  function takeMultiplePicturesAtOnce() {
    setTimer(true);
    let count = 0;
    let intervalId = setInterval(() => {
        console.log(count);
        console.log(shots.length);
        console.log(shotsNum);
        count++;
        if (count <= shotsNum) {
            runCountdownCapture();
        } else {
            clearInterval(intervalId);
        }
    }, 4000)
  }

    async function runCountdownCapture() {
        if (!streamRef.current) {
        setError("Start the camera first.");
        return;
        }
        if (isCapturing) return;

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
            if (next.length === shotsNum) {
            // Compose the strip automatically when we reach target
            composeStrip(next);
            }
            return next;
        });
        }

        setIsCapturing(false);
  }

function composeStrip(images: string[]) {
    const frameCanvas = frameCanvasRef.current;
const composeCanvas = composeCanvasRef.current;
if (!frameCanvas || !composeCanvas) return;

const w = frameCanvas.width;
const singleH = frameCanvas.height;

// 0) No gutter, no frame — total height is just N * singleH
const totalH = singleH * images.length;
composeCanvas.width = w;
composeCanvas.height = totalH;

const ctx = composeCanvas.getContext("2d");
if (!ctx) return;

// Optional background (or omit to keep transparent PNG)
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, w, totalH);

// Draw each image directly one after another
let done = 0;
images.forEach((data, idx) => {
  const img = new Image();
  img.onload = () => {
    const y = idx * singleH; // touches previous image

    // Apply filter only to the photo (keeps background crisp)
    ctx.save();
    ctx.filter = filter === "blackwhite" ? "grayscale(1)" : "none";
    ctx.drawImage(img, 0, y, w, singleH);
    ctx.restore();

    // Export when all have drawn (handles async load order)
    if (++done === images.length) {
      setFinalStrip(composeCanvas.toDataURL("image/png"));
    }
  };
  img.src = data;
});

}


  function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  const videoFilterClasses = filter === 'blackwhite' ? 'blackwhite'
 : '';
  const canCaptureMore = shots.length < shotsNum;


    return (

        <div className="photobooth-center">
                <p>Photo time woohooo</p>

<div>
<video
ref={videoRef}
autoPlay
muted
playsInline
className={videoFilterClasses}
/>
</div>
<div onClick={stopCamera}>Stop Camera</div>
              <button
                className="px-4 py-2 rounded-xl shadow bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                onClick={takeMultiplePicturesAtOnce}
                disabled={ !canCaptureMore}
              >
                {canCaptureMore ? "Capture" : "Captured"}
              </button>


        <p>hi</p>
            <div className="grid grid-cols-3 gap-2">
              {shots.map((s, i) => (
                <img key={i} src={s} alt={`Shot ${i + 1}`} className="rounded-lg shadow" />
              ))}
            </div>


              <button
                className="px-4 py-2 rounded-xl shadow bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                onClick={() => finalStrip && download(finalStrip, `strip-${shots.length}x.png`)}
                disabled={!finalStrip}
              >
                Download Strip
              </button>



        {/* Final strip preview */}
        {finalStrip && (
          <section className="mt-6">
            <h2 className="text-lg font-medium mb-2">Final Strip Preview</h2>
            <img src={finalStrip} alt="Photo strip" className="rounded-2xl shadow max-h-[70vh]" />
          </section>
        )}

                    {/* Hidden canvases (1: last frame, 2: composition) */}
        <div className="hidden-canvases">
          <canvas ref={frameCanvasRef} />
          <canvas ref={composeCanvasRef} />
        </div>
        </div>
    )
}
