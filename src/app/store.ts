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

