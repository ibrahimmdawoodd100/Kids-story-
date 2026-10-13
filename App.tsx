
import React, { useState, useCallback, useEffect } from 'react';
import { StoryForm } from './components/StoryForm';
import { StoryPreview } from './components/StoryPreview';
import { LoadingIndicator } from './components/LoadingIndicator';
import { MagicWandIcon } from './components/icons/MagicWandIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { FormData, Story } from './types';
import { generateStoryWorkflow } from './services/geminiService';
import { saveStoryToDB, getAllStoriesFromDB, deleteStoryFromDB } from './services/storageService';
import { StoryArchive } from './components/StoryArchive';

type AppView = 'create' | 'archive' | 'view-story';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('create');
    const [story, setStory] = useState<Story | null>(null);
    const [archive, setArchive] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadArchive();
    }, []);

    const loadArchive = async () => {
        try {
            const stories = await getAllStoriesFromDB();
            setArchive(stories);
        } catch (err) {
            console.error("Failed to load archive", err);
        }
    };

    const handleStoryGeneration = useCallback(async (formData: FormData, imageData: { data: string; mimeType: string; }) => {
        setIsLoading(true);
        setError(null);
        setStory(null);
        
        const updateStep = (step: string) => {
            setLoadingStep(String(step));
        };

        try {
            const generatedStory = await generateStoryWorkflow(formData, imageData, updateStep);
            
            const storyToSave: Story = {
                ...generatedStory,
                id: crypto.randomUUID(),
                timestamp: Date.now()
            };

            await saveStoryToDB(storyToSave);
            
            setStory(storyToSave);
            setView('view-story');
            loadArchive();
        } catch (err: any) {
            console.error('Error generating story:', err);
            let errorMessage = 'حدث خطأ أثناء إنشاء القصة. يرجى المحاولة مرة أخرى.';
            const errorStr = String(err?.message || err || '');
            
            if (errorStr.includes('429') || errorStr.includes('quota')) {
                errorMessage = 'الخدمة مشغولة حالياً، يرجى الانتظار دقيقة والمحاولة مجدداً.';
            } else {
                errorMessage = `حدث خطأ: ${errorStr}`;
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    }, []);

    const handleViewStory = (selectedStory: Story) => {
        setStory(selectedStory);
        setView('view-story');
    };

    const handleDeleteFromArchive = async (id: string) => {
        try {
            await deleteStoryFromDB(id);
            setArchive(prev => prev.filter(s => s.id !== id));
            if (story?.id === id) {
                setStory(null);
                setView('create');
            }
        } catch (err) {
            alert("فشل حذف القصة.");
        }
    };

    return (
        <div className="min-h-screen bg-rose-50 text-gray-800 pb-12" dir="rtl">
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('create')}>
                        <MagicWandIcon className="h-8 w-8 text-rose-500" />
                        <h1 className="text-xl md:text-2xl font-bold text-rose-800">صانع قصص الأطفال</h1>
                    </div>
                    
                    <nav className="flex items-center bg-rose-50 p-1 rounded-xl border border-rose-100">
                        <button 
                            onClick={() => setView('create')}
                            className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${view === 'create' || view === 'view-story' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-rose-600'}`}
                        >
                            <MagicWandIcon className="h-4 w-4" />
                            <span>إنشاء قصة</span>
                        </button>
                        <button 
                            onClick={() => setView('archive')}
                            className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${view === 'archive' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-rose-600'}`}
                        >
                            <BookOpenIcon className="h-4 w-4" />
                            <span>أرشيفي ({archive.length})</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                {view === 'archive' ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <BookOpenIcon className="h-8 w-8 text-rose-500" />
                            <h2 className="text-3xl font-bold text-rose-800 font-storybook">أرشيف مغامراتي</h2>
                        </div>
                        <StoryArchive stories={archive} onViewStory={handleViewStory} onDeleteStory={handleDeleteFromArchive} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4">
                            <StoryForm onSubmit={handleStoryGeneration} isLoading={isLoading} />
                        </div>
                        <div className="lg:col-span-8">
                            {isLoading && <LoadingIndicator step={loadingStep} />}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-2xl shadow-sm" role="alert">
                                    <p className="font-bold">عذراً، حدث خطأ</p>
                                    <p>{String(error)}</p>
                                    <button onClick={() => setError(null)} className="mt-4 text-xs font-bold underline">إغلاق</button>
                                </div>
                            )}
                            {story && !isLoading && !error && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><StoryPreview story={story} /></div>}
                            {!story && !isLoading && !error && (
                                    <div className="flex flex-col items-center justify-center h-full bg-white rounded-3xl p-12 shadow-xl border-2 border-dashed border-rose-100 min-h-[500px] text-center">
                                    <div className="w-32 h-32 bg-rose-50 rounded-full flex items-center justify-center mb-8 animate-bounce">
                                        <MagicWandIcon className="h-16 w-16 text-rose-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-rose-800 mb-4 font-storybook">جاهز للمغامرة؟</h2>
                                    <p className="text-gray-500 max-w-sm leading-relaxed text-lg">ارفع صورة طفلك الآن لنقوم بتحويله إلى بطل في قصة سحرية رائعة.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
