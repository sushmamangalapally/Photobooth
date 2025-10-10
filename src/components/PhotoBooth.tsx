import { useState } from 'react';
import PhotoBoothSettings from './PhotoBoothSettings'
import PhotoboothVideoCamera from './PhotoboothVideoCamera';
import { useAppStore } from "../app/store.ts";

export default function PhotoBooth() {
    const [cameraOn, setCameraOn] = useState<boolean>(false);
    const view = useAppStore((s) => s.view);

    return (
        <div className="photobooth-center">
            {view == 'booth' && <PhotoBoothSettings/>}

            {view == 'session'  && (
                <>
                    {!cameraOn && 
                        (
                            <>
                                <p>Photo Time! Get ready to look good!</p>
                                <p>Tips: Use HTTPS, allow camera permissions, and keep the app open while capturing.</p>
                                <button
                                className="btn"
                                onClick={() => setCameraOn(true)}
                                >
                                    Start Camera
                                </button>
                            </>
                        )
                    }
                    {cameraOn && 
                        <PhotoboothVideoCamera
                            cameraOn={cameraOn}
                            setCameraOn={setCameraOn}
                        />
                    }
                </>
            )}
        </div>
    )
}
