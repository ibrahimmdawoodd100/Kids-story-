
export interface FormData {
    childName: string;
    storyPrompt: string;
    age: number;
    language: string;
    numChapters: number;
    scenesPerChapter: number;
    voiceName: string;
}

export interface PdfSettings {
    fontFamily: 'Cairo' | 'Amiri' | 'Lalezar';
    fontSize: number;
    fontColor: string;
    lineHeight: number;
    margins: number; // In pixels
    textAlign: 'right' | 'center' | 'left' | 'justify';
    pageSize: 'a4' | 'a5' | 'letter';
    direction: 'rtl' | 'ltr';
    backgroundColor: string;
}

export interface Scene {
    scene_number: number;
    text: string;
    image_prompt: string;
    layout_type?: 'full-image' | 'split' | 'text-heavy';
    design_notes?: string;
    imageUrl?: string;
    audioUrl?: string;
}

export interface Chapter {
    chapter_number: number;
    title: string;
    scenes: Scene[];
    audioUrl?: string;
}

export interface Story {
    id: string;
    timestamp: number;
    title: string;
    chapters: Chapter[];
    titleAudioUrl?: string; 
    outroAudioUrl?: string; 
    fullAudioUrl?: string; 
    coverImageUrl?: string;
}
