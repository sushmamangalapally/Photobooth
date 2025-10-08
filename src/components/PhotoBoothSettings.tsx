import { useState } from 'react';
import { useAppStore } from "../app/store.ts";

export default function PhotoBoothSettings() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [shotsNum, setShotsNum] = useState(4);
  const [textDirection, setTextDirection] = useState('top');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [selectedColorBooth, setSelectedColorBooth] = useState('color');

  const handleText = (event) => {
    const inputText = event.target.value;
    if (inputText.length > 15) {
        setError('Text too long! Make sure it\'s less than 15 characters!');
        return;
    }
    setText(event.target.value);
  };

    const startPhotoSession = useAppStore((s) => s.startPhotoSession);
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    console.log('Submitted name:');
    startPhotoSession();

  };

    return (

        <div>
            <p>settings</p>
            <form onSubmit={handleSubmit}>
            <label>
                Number of shots:
                <select value={shotsNum} onChange={(e) => setShotsNum(e.target.value)}>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
            </label>
            <div>
            <label htmlFor="color-booth">Color or Black & White:</label>
                <select value={selectedColorBooth} onChange={(e) => setSelectedColorBooth(e.target.value)}>
                    <option value="color">Color</option>
                    <option value="blackwhite">Black & White</option>
                </select>
            </div>
            <label>
                Add Text:
                <input type="text" value={name} onChange={handleText} />
            </label>
            <label>
                Add Text Top or Below:
                <select value={textDirection} onChange={(e) => setTextDirection(e.target.value)}>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                </select>
            </label>
            <div>
            <label htmlFor="color-picker">Select a Color for frames:</label>
            <input
                type="color"
                id="color-picker"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
            />
            <div
                style={{
                    width: '100px',
                    height: '50px',
                    backgroundColor: selectedColor,
                    marginTop: '10px',
                    border: '1px solid #ccc'
                }}
            ></div>
            </div>

            <button type="submit">Start Photo Session</button>
    </form>

        </div>
    )
}