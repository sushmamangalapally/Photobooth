import PhotoBoothSettings from './PhotoBoothSettings'
import PhotoboothVideoCamera from './PhotoboothVideoCamera';
import { useAppStore } from "../app/store.ts";

export default function PhotoBooth() {
    const view = useAppStore((s) => s.view);

    return (
        <div className="photobooth-center">
            {view === 'booth' && <PhotoBoothSettings/>}
            {view === 'session' && <PhotoboothVideoCamera />}
        </div>
    )
}
