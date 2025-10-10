import { useState, useRef, useEffect } from 'react';
import PhotoBoothSettings from './PhotoBoothSettings'
import PhotoboothVideoCamera from './PhotoboothVideoCamera';
import { useAppStore } from "../app/store.ts";

export default function PhotoBooth() {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cameraOn, setCameraOn] = useState<boolean>(false);
    const view = useAppStore((s) => s.view);


//       async function startCamera() {
//     try {
//       setError(null);
//         // If we already have a stream (e.g., remount), reuse it
//         if (!streamRef.current) {
//           const ms = await navigator.mediaDevices.getUserMedia({
//             audio: false, // request mic only if you need it
//             video: {
//               width: { ideal: 1280 },
//               height: { ideal: 720 },
//               facingMode: "user",
//             },
//           });
//         //   if (stopped) return;
//           streamRef.current = ms;
//         }

//         // Attach to <video> if present
//         if (videoRef.current && streamRef.current) {
//           const v = videoRef.current;
//           v.srcObject = streamRef.current;
//           v.setAttribute("playsinline", "true"); // iOS Safari
//           try {
//             await v.play(); // may require a user gesture on iOS
//           } catch (e) {
//             // If autoplay is blocked, button press later will succeed
//           }
//         }
//       } catch (e: any) {
//         console.error(e);
//         setError(e?.message ?? "Unable to access camera");
//       }
//   }

    return (

        <div className="photobooth-center">
            <p>Booth</p>
            {view == 'booth' && <PhotoBoothSettings/>}
            {view == 'session'  && (
                <div>
                <p>Photo time</p>
                <button
                className="px-4 py-2 rounded-xl shadow bg-white hover:bg-neutral-100 disabled:opacity-60"
                onClick={() => setCameraOn(true)}
              >
                Start Camera
              </button>
                {cameraOn && 
                <PhotoboothVideoCamera
                    cameraOn={cameraOn}
                    setCameraOn={setCameraOn}
                />
}
</div>
            )}
        </div>
    )
}
