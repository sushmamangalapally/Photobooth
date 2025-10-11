import './App.css'
import PhotoBoothEntrance from './components/PhotoBoothEntrance';
import PhotoBooth from './components/PhotoBooth';
import { useAppStore } from "./app/store";

function App() {
  const view = useAppStore((s) => s.view);
  const exitBooth = useAppStore((s) => s.exitBooth);

  return (
    <div className="photo-booth-app">
      <h1 className="title" onClick={exitBooth}>Retro Photobooth</h1>
      <div className="centered-content">
      { view === "landing" ? <PhotoBoothEntrance /> : <PhotoBooth/>}
      </div>
    </div>
  )
}

export default App
