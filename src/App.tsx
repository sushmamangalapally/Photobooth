import './App.css'
import PhotoBoothEntrance from './components/PhotoBoothEntrance';
import PhotoBooth from './components/PhotoBooth';
import { useAppStore } from "./app/store";

function App() {
  const view = useAppStore((s) => s.view);

  return (
    <div className="photo-booth-app">
      <h1>Retro Photobooth</h1>
      <div className="centered-content">
      { view === "landing" ? <PhotoBoothEntrance /> : <PhotoBooth/>}
      </div>
    </div>
  )
}

export default App
