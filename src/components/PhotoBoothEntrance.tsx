import { ReactComponent as Photobooth } from '../assets/photobooth.svg';
import { useAppStore } from "../app/store";

export default function PhotoBoothEntrance() {
    const enterBooth = useAppStore((s) => s.enterBooth);

    return (
        <div className="photobooth-center">
            <div className="booth">
                <Photobooth/>
                <button 
                    onClick={enterBooth}
                    className="enter"
                    id="enter">
                        enter →
                </button>
            </div>
        </div>
    )
}