
import React from 'react';
import { Story } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface StoryArchiveProps {
    stories: Story[];
    onViewStory: (story: Story) => void;
    onDeleteStory: (id: string) => void;
}

export const StoryArchive: React.FC<StoryArchiveProps> = ({ stories, onViewStory, onDeleteStory }) => {
    if (stories.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border-2 border-dashed border-rose-100">
                <div className="mb-4 flex justify-center">
                    <BookOpenIcon className="h-16 w-16 text-rose-200" />
                </div>
                <h3 className="text-xl font-bold text-rose-800">أرشيفك فارغ حالياً</h3>
                <p className="text-gray-500 mt-2">ابدأ بصناعة أول قصة سحرية لتظهر هنا!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {stories.map((story) => (
                <div 
                    key={story.id} 
                    className="bg-white rounded-2xl shadow-md overflow-hidden border border-rose-50 hover:shadow-xl transition-shadow group relative"
                >
                    <div className="aspect-video relative overflow-hidden bg-rose-50">
                        {story.chapters[0]?.scenes[0]?.imageUrl ? (
                            <img 
                                src={story.chapters[0].scenes[0].imageUrl} 
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-rose-200">
                                <BookOpenIcon className="h-12 w-12" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                        <div className="absolute bottom-3 right-3 left-3">
                            <h4 className="text-white font-bold text-lg leading-tight truncate font-storybook">
                                {story.title}
                            </h4>
                            <p className="text-white/80 text-xs mt-1">
                                {new Date(story.timestamp).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>
                    
                    <div className="p-4 flex gap-2">
                        <button 
                            onClick={() => onViewStory(story)}
                            className="flex-1 bg-rose-500 text-white py-2 rounded-lg font-bold hover:bg-rose-600 transition text-sm"
                        >
                            فتح القصة
                        </button>
                        <button 
                            onClick={() => {
                                if(confirm('هل أنت متأكد من حذف هذه القصة من الأرشيف؟')) {
                                    onDeleteStory(story.id);
                                }
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition"
                            title="حذف من الأرشيف"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
