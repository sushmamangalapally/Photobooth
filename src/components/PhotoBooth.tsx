import { useState } from 'react';
import PhotoBoothSettings from './PhotoBoothSettings'

import { useAppStore } from "../app/store.ts";

export default function PhotoBooth() {
    const [showSettings, setShowSettings] = useState(true);
    const view = useAppStore((s) => s.view);
    return (

        <div className="photobooth-center">
            <p>Booth</p>
            {view == 'booth' && <PhotoBoothSettings/>}
            {view == 'session'  && (
                <p>Photo time</p>
            )}
        </div>
    )
}