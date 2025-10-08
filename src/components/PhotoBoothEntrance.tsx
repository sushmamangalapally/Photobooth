import {useState} from 'react';
import { ReactComponent as Photobooth } from '../assets/photobooth.svg';
import { ReactComponent as PhotoboothEmpty } from '../assets/photobooth_curtains_100.svg'
import { useAppStore } from "../app/store";

export default function PhotoBoothEntrance() {
    const enterBooth = useAppStore((s) => s.enterBooth);
  const [isHovered, setIsHovered] = useState(false);

  return (
        <div className="photobooth-center">
            <div className="booth">
                {/* <PhotoboothEmpty />
                {isHovered ? <PhotoboothEmpty /> : <Photobooth />} */}
                <Photobooth/>
                <button 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={enterBooth} className="enter" id="enter">enter →</button>
            </div>
        </div>
    )
}