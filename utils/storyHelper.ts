
import { Story } from '../types';

export type PageType = 'cover' | 'chapter_title' | 'scene' | 'end';

export interface PageData {
    type: PageType;
    title?: string;
    text?: string;
    imageUrl?: string;
    audioUrl?: string;
    chapterNum?: number;
    sceneNum?: number;
    layoutType?: 'full-image' | 'split' | 'text-heavy';
}

export const getStoryPages = (story: Story): PageData[] => {
    const pages: PageData[] = [];
    
    // 1. Cover
    pages.push({
        type: 'cover',
        title: story.title,
        imageUrl: story.coverImageUrl || story.chapters[0]?.scenes[0]?.imageUrl,
        audioUrl: story.titleAudioUrl
    });

    story.chapters.forEach(chapter => {
        // 2. Chapter Title Page
        pages.push({
            type: 'chapter_title',
            title: chapter.title,
            chapterNum: chapter.chapter_number,
            audioUrl: chapter.audioUrl
        });

        // 3. Scenes
        chapter.scenes.forEach(scene => {
            pages.push({
                type: 'scene',
                text: scene.text,
                imageUrl: scene.imageUrl,
                audioUrl: scene.audioUrl,
                chapterNum: chapter.chapter_number,
                sceneNum: scene.scene_number,
                layoutType: scene.layout_type
            });
        });
    });

    // 4. End Page
    pages.push({
        type: 'end',
        title: 'النهاية',
        text: 'نتمنى أن تكون القصة قد نالت إعجابكم',
        audioUrl: story.outroAudioUrl // Play the specific call-to-action audio here
    });

    return pages;
};
