import { useState, useRef, useEffect } from 'react';
import PhotoBoothSettings from './PhotoBoothSettings'
import Modal from './Modal';
import { useAppStore, useSettingsStore } from "../app/store.ts";
import {ReactComponent as CameraIcon} from '../assets/camera-icon.svg'

export default function PhotoBoothVideoCamera({cameraOn, setCameraOn}) {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean | null>(false);
  const [shots, setShots] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [wholecountdown, setWholeCountdown] = useState<number | null>(null);
  const [loadingCamera, setLoadingCamera] = useState<boolean | null>(false);
  const [timer, setTimer] = useState<boolean | null>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean | null>(false);
  

  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null); // visible preview capture
  const composeCanvasRef = useRef<HTMLCanvasElement | null>(null); // offscreen composition
  const [finalStrip, setFinalStrip] = useState<string | null>(null);
  const [completeStrip, setCompleteStrip] = useState<boolean | null>(null);
  


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




    console.log('filter')
    console.log(filter)
    if (filter === 'blackwhite') {
        ctx.filter = 'grayscale(1)';
    }


    ctx.drawImage(vid, 0, 0, w, h);

    return canvas.toDataURL("image/png");
  }

  function takeMultiplePicturesAtOnce() {
    
    let count = 0;
    if (completeStrip) {
        startCamera();
    }
    setIsCameraOn(true);
    setLoadingCamera(true);
    setError(null);
    setShots([]);
    setCountdown(null);
    setTimer(false);
    setFinalStrip(null);
    setCompleteStrip(null);
    let intervalId = setInterval(async () => {
        setLoadingCamera(false);
        console.log('count ',count);
        console.log('shots length ',shots.length);
        console.log('shotsNum ',shotsNum);
        console.log('countdown ',countdown);
        count++;
        // if (count === 0) {
        //     for (let i = 7; i >= 4; i--) {
        //         setWholeCountdown(i);
        //         await sleep(800);
        //     }

        // }
        if (count <= shotsNum) {
            setTimer(true);
            runCountdownCapture();
        } else {
            setTimer(false);
            stopCamera();
            setIsCameraOn(false);
            setLoadingCamera(false);
            // setWholeCountdown(null);
            clearInterval(intervalId);
        }
    }, 4000);
    // let totalCount = 0;
    // let countIntervalId = setInterval(async () => {
    //     console.log(totalCount);
    //     console.log(shots.length);
    //     console.log(shotsNum);
    //     totalCount++;

    //     for (let i = 7; i >= 1; i--) {
    //         setWholeCountdown(i);
    //         await sleep(800);
    //     }
    //     if (totalCount === 7) {

    //         setWholeCountdown(null);
    //         clearInterval(countIntervalId);
    //     }
    // }, 4000);
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
        setWholeCountdown(i);
        await sleep(800);
        }
        setCountdown(null);

        const data = drawFrameToCanvas();
        if (data) {
        setShots((prev) => {
            const next = [...prev, data].slice(0, shotsNum);
            if (next.length === Number(shotsNum)) {
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

        const w = frameCanvas.width;        // width of each photo
        const singleH = frameCanvas.height; // height of each photo

        // Layout constants
        const headerSpace = 72;          // space for the title
        const innerPadding = 10;               // light-blue inner padding
        const borderStroke = 34;           // thick blue border stroke

        // Canvas size = (left+right mat) + header + stacked photos + (top+bottom mat)
        const totalH = headerSpace + images.length * singleH + innerPadding * 2;
        composeCanvas.width = w + innerPadding * 2;
        composeCanvas.height = totalH;

        const ctx = composeCanvas.getContext("2d");
        if (!ctx) return;

        // ---- background + mat + border ----
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, composeCanvas.width, composeCanvas.height);

        // light-blue inner fill (mat)
        ctx.fillStyle = selectedColor;
        ctx.fillRect(innerPadding, innerPadding, composeCanvas.width - 2 * innerPadding, composeCanvas.height - 2 * innerPadding);

        // thick outer blue border
        ctx.strokeStyle = selectedColor; // blue
        ctx.lineWidth = borderStroke;
        ctx.strokeRect(0, 0, composeCanvas.width, composeCanvas.height);

        // ---- title (centered in header band) ----
        ctx.fillStyle = selectedTextColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "600 28px Helvetica, Roboto, Arial";
        ctx.fillText(text, composeCanvas.width / 2, innerPadding + headerSpace / 2);

        // ---- draw photos stacked with no gaps ----
        let loaded = 0;
        images.forEach((data, idx) => {
            const img = new Image();
            img.onload = () => {
                const x = innerPadding; // align with inner fill
                const y = innerPadding + headerSpace + idx * singleH; // edge-to-edge stacking

                ctx.save();
                // apply filter ONLY to the photo
                if (filter === "blackwhite"){
                    ctx.filter = "grayscale(1)";
                }
                else {
                    ctx.filter = "none";
                }

                ctx.drawImage(img, x, y, w, singleH);
                ctx.restore();
                loaded++;

                if (loaded === images.length) {
                    setFinalStrip(composeCanvas.toDataURL("image/png"));
                    setCompleteStrip(true)
                }
            };
            img.src = data;
        });
    }

  function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  function download(dataUrl: string) {
    const filename = `strip-${shots.length}-${Date.now()}.png`;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  

  const videoFilterClasses = filter === 'blackwhite' ? 'blackwhite'
 : '';
  const canCaptureMore = shots.length < shotsNum;
  const [modalImage, setModalImage] = useState(null);

    const enterBooth = useAppStore((s) => s.enterBooth);



  const openModal = (image) => {

    setModalImage(image);

  };



  const closeModal = () => {

    setModalImage(null);

  };

  function backToSettings() {

    // stopCamera();

    // setLoadingCamera(false);

    // setError(null);

    // setShots([]);

    // setCountdown(null);

    // setTimer(false);

    // setFinalStrip(null);

    // setCompleteStrip(null);

    enterBooth();

  }

  const takePicture = (shots.length < shotsNum) || isCameraOn;

    return (

        <div className="photobooth-center">
                <p className="settings-btn" onClick={backToSettings}>Back to Settings</p>
            <div className="photobooth-center-btn">
                <button
                    className="btn camera"
                    onClick={takeMultiplePicturesAtOnce}
                    disabled={isCameraOn}
                >
                    <CameraIcon fill="#fff"/>
                    {/* {canCaptureMore ? "Capture" : "Captured"} */}
                </button>
            </div>

            <div>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={videoFilterClasses}
                />
                {loadingCamera && (      <div className="spinner-container">
        <div className="spinner-icon"></div> {/* Or an actual icon */}
      </div>
)}
                {/* Countdown overlay */}
                {!loadingCamera && countdown !== null && (
<div className="countdown-section">
                {/* <div className="spinner-container">
        <div className="spinner-icon"></div></div>
                    <span className="text-white text-7xl font-bold">1{countdown}</span> */}
                    <span className="text-white text-7xl font-bold"> {shots.length}/{shotsNum} </span>
                </div>
                )}
                {countdown && (
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



                {/* <div className="countdown-section">
                    <span className="text-white text-7xl font-bold"> {shots.length}/{shotsNum} </span>
                </div> */}

            </div>

            {!completeStrip && !timer && (<div className="photobooth-center-btn">
                <button
                    className="btn"
                    onClick={stopCamera}
                    disabled={timer}
                >
                    Stop Camera
                </button>
            </div>)}
 
 

{!finalStrip && (
            <div className="shots">
              {shots.map((s, i) => (
                <img key={i} src={s} alt={`Shot ${i + 1}`} className="rounded-lg shadow" />
              ))}
            </div>
)}


        {finalStrip && (

            <>

            <div className="photobooth-center-btn">

              <button

                className="btn"

                onClick={() => finalStrip && download(finalStrip, `strip-${shots.length}x.png`)}

                disabled={!finalStrip}

              >

                Download Strip

              </button>

            </div>

          <section className="mt-6">

            <h2 className="text-lg font-medium mb-2">Final Strip Preview</h2>

            <img src={finalStrip} alt="Photo strip" className="final-strip" onClick={() => openModal({largeUrl: finalStrip, alt: 'Photo strip'})} />

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
