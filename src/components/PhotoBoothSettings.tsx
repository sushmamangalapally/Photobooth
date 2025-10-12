import { useState } from 'react';
import { useAppStore, useSettingsStore } from "../app/store.ts";
import { ReactComponent as TextIcon } from '../assets/text-icon.svg';
import { ReactComponent as ShotsIcon } from '../assets/shots-icon.svg'
import { ReactComponent as FilterIcon } from '../assets/filter-icon.svg';
import { ReactComponent as DirIcon } from '../assets/direction-icon.svg'
import { ReactComponent as FramesIcon } from '../assets/frames-icon.svg'
import '../styles/formsCard.css';


export default function PhotoBoothSettings() {
    const [error, setError] = useState<string | null>(null);

    const { text, shotsNum, textDirection, selectedColor, selectedTextColor, selectedFilter, setText, setShotsNum, setTextDirection, setSelectedColor, setSelectedTextColor, setSelectedFilter  } = useSettingsStore();


    const handleText = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const inputText = event.target.value;
        if (inputText.length > 25) {
            setError('Text too long! Make sure it\'s less than 25 characters!');
            return;
        }
        setText(event.target.value);
    };

    const startPhotoSession = useAppStore((s) => s.startPhotoSession);

    const handleSubmit = () => {
        startPhotoSession();
    };

    return (
        <div>
            <section className="card-settings">
                <h2>Settings</h2>

                <div className="grid">
                    <div className="field">
                        <label htmlFor="text">Add Text</label>
                        <div className="input-wrap">
                            <span className="leading" aria-hidden="true">
                                <TextIcon />
                            </span>
                            <input id="text"
                            className="input" type="text" placeholder="Itsss a photobooth time!" value={text} onChange={handleText}/>
                        </div>
                        {error && <span className="error-warning">{error}</span>}
                    </div>
    
                    <div className="field">
                        <label htmlFor="shotsNum">Number of Shots:</label>
                        <div className="select-wrap">
                            <span className="leading" aria-hidden="true" >
                                <ShotsIcon />
                            </span>
                            <select id="shotsNum" className="select" value={shotsNum} onChange={(e) => setShotsNum(Number(e.target.value))}>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                            </select>
                            <span className="chev" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="black"><path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"/></svg>
                            </span>
                        </div>
                    </div>
    
                    <div className="field">
                        <label htmlFor="filter">Filter:</label>
                        <div className={selectedFilter === 'color' ? 'select-wrap rainbow-bcgr' : 'select-wrap'}>
                            <FilterIcon/>
                            <select id="filter" className="select" value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
                                <option value="color">Color</option>
                                <option value="blackwhite">Black & White</option>
                            </select>
                            <span className="chev" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="black"><path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"/></svg>
                            </span>
                        </div>
                    </div>
    
                    <div className="field">
                        <label htmlFor="textDirection">Add Text Top or Below:</label>
                        <div className="select-wrap">
                            <DirIcon />
                            <select id="textDirection" className="select" value={textDirection} onChange={(e) => setTextDirection(e.target.value)}>
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                            </select>
                            <span className="chev" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="black"><path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"/></svg>
                            </span>
                        </div>
                    </div>
    
                    <div className="field">
                        <label htmlFor="filter">Select a Color for frames:</label>
                        <div className="input-wrap">
                            <span className="leading" aria-hidden="true">
                                <FramesIcon fill={selectedColor}/>
                            </span>
                            <input
                                type="color"
                                id="color-picker"
                                className="input" 
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                            />
                        </div>
                    </div>
    
                    <div className="field">
                        <label htmlFor="filter">Select a Color for Text:</label>
                        <div className="input-wrap">
                            <span className="leading" aria-hidden="true">
                                <TextIcon />
                            </span>
                            <input
                                type="color"
                                id="color-picker"
                                className="input" 
                                value={selectedTextColor}
                                onChange={(e) => setSelectedTextColor(e.target.value)}
                            />
                        </div>
                    </div>

                    <button className="btn" type="button" onClick={handleSubmit}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5z"/></svg>
                        Start Photo Session
                    </button>
                    
                    <p>Photo Time! Get ready to look good!</p>
                    <p>Tips: Use HTTPS, allow camera permissions, and keep the app open while capturing.</p>
                </div>
            </section>
        </div>
    )
}