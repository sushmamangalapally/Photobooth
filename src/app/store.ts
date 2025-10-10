import { create } from 'zustand';

type View = "landing" | "booth" | "session";

type AppState = {
    view: View;
    enterBooth: () => void;
    exitBooth: () => void;
    startPhotoSession: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    view: 'landing',
    enterBooth: () => set({view: 'booth'}),
    startPhotoSession: () => set({view: 'session'}),
    exitBooth: () => set({view: 'landing'}),
}));

interface SettingsState {
    text: string;
    shotsNum: number;
    textDirection: 'top' | 'bottom';
    selectedColor: string;
    selectedFilter: string;
    selectedTextColor: string;
    
    setText: (text: string) => void;
    setShotsNum: (shotsNum: number) => void;
    setTextDirection: (textDirection: string) => void;
    setSelectedColor: (selectedColor: string) => void;
    setSelectedTextColor: (selectedTextColor: string) => void;
    setSelectedFilter: (selectedFilter: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
      text: 'its a photoboothhhh',
      shotsNum: 3,
      textDirection: 'top',
      selectedColor: '#000000ff',
      selectedFilter: 'color',
      selectedTextColor: '#fff',

      // Actions to update settings
      setText: (text) => set({ text }),
      setShotsNum: (shotsNum) => set({ shotsNum: Number(shotsNum) }),
      setTextDirection: (textDirection) => set({ textDirection }),
      setSelectedColor: (selectedColor) => set({ selectedColor }),
      setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
}));
