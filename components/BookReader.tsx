
import React, { useState, useEffect, useRef } from 'react';
import { Story } from '../types';
import { getStoryPages, PageData } from '../utils/storyHelper';
import { StoryPage } from './StoryPage';

interface BookReaderProps {
    story: Story;
    onClose: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ story, onClose }) => {
    const [pages, setPages] = useState<PageData[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [prevPage, setPrevPage] = useState<number | null>(null);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // المرجع الوحيد والمقدس للصوت الحالي
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const navigationLockRef = useRef<boolean>(false);

    useEffect(() => {
        setPages(getStoryPages(story));
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        
        return () => {
            stopAudioDirectly();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [story]);

    // وظيفة لإيقاف وتدمير أي صوت نشط فوراً
    const stopAudioDirectly = () => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.onended = null;
            currentAudioRef.current.oncanplaythrough = null;
            currentAudioRef.current.src = "";
            currentAudioRef.current.load(); // تفريغ الـ Buffer
            currentAudioRef.current = null;
        }
    };

    const playSoundEffect = (type: 'turn' | 'click') => {
        const ctx = audioContextRef.current;
        if (!ctx || ctx.state === 'closed') return;
        if (ctx.state === 'suspended') ctx.resume();
        const t = ctx.currentTime;
        if (type === 'turn') {
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.05 * (1 - i / data.length);
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.setValueAtTime(800, t);
            noise.connect(filter); filter.connect(ctx.destination);
            noise.start(t);
        }
    };

    // المحرك الأساسي للصوت والمزامنة
    useEffect(() => {
        if (!isPlaying || pages.length === 0) {
            stopAudioDirectly();
            return;
        }

        const page = pages[currentPage];
        if (!page?.audioUrl) return;

        // 1. تنظيف أي بقايا صوتية قبل البدء
        stopAudioDirectly();

        // 2. إنشاء كائن صوتي جديد تماماً
        const audio = new Audio(page.audioUrl);
        audio.preload = "auto";
        currentAudioRef.current = audio;

        // 3. المزامنة: يبدأ الصوت فوراً
        audio.play().catch(e => console.warn("Playback prevented:", e));

        // 4. الانتقال التلقائي الصارم
        audio.onended = () => {
            // نتحقق من أننا ما زلنا في وضع التشغيل ولم يتم تغيير الصفحة يدوياً
            if (isPlaying && currentAudioRef.current === audio && currentPage < pages.length - 1) {
                navigate('next');
            } else if (currentPage === pages.length - 1) {
                setIsPlaying(false);
            }
        };

        // تنظيف عند خروج المكون أو تغير الاعتماديات
        return () => stopAudioDirectly();
    }, [currentPage, isPlaying, pages]);

    const navigate = (dir: 'next' | 'prev') => {
        // منع التداخل إذا كان هناك حركة قائمة أو قفل
        if (isAnimating || navigationLockRef.current) return;
        
        const isNext = dir === 'next';
        if (isNext && currentPage >= pages.length - 1) return;
        if (!isNext && currentPage <= 0) return;

        // تفعيل القفل
        navigationLockRef.current = true;
        
        // إيقاف الصوت الحالي فوراً (قبل تحديث الحالة)
        stopAudioDirectly();
        
        playSoundEffect('turn');
        setIsAnimating(true);
        setPrevPage(currentPage);
        setDirection(dir);
        setCurrentPage(prev => isNext ? prev + 1 : prev - 1);

        // فتح القفل بعد انتهاء الأنيميشن
        setTimeout(() => {
            setIsAnimating(false);
            navigationLockRef.current = false;
        }, 750);
    };

    const togglePlay = () => {
        if (!isPlaying) {
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
            stopAudioDirectly();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-2 overflow-hidden" dir="rtl">
            <div className="w-full max-w-lg flex justify-between items-center mb-6 text-white px-4 z-10">
                <button onClick={() => { stopAudioDirectly(); onClose(); }} className="p-3 bg-white/10 rounded-full hover:bg-rose-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <div className="flex items-center gap-6">
                    <div className="text-lg font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                        {currentPage + 1} <span className="text-white/30 mx-1">/</span> {pages.length}
                    </div>
                    <button onClick={togglePlay} className={`rounded-full p-4 transition-all shadow-2xl active:scale-95 ${isPlaying ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="relative w-full h-full max-h-[75vh] md:max-h-[85vh] aspect-[9/16] max-w-md perspective-2000">
                <div className="absolute right-[-2px] top-[1%] bottom-[1%] w-3 bg-white/5 rounded-r-lg blur-[1px] z-0"></div>

                <div className="relative w-full h-full transform-style-3d">
                    {prevPage !== null && (
                        <div className="absolute inset-0 bg-[#F9F5EF] rounded-xl shadow-inner overflow-hidden opacity-30">
                             <StoryPage page={pages[prevPage]} pageIndex={prevPage} totalPages={pages.length} />
                        </div>
                    )}

                    {pages[currentPage] && (
                        <div 
                            key={currentPage} 
                            className={`absolute inset-0 bg-white rounded-xl shadow-2xl overflow-hidden origin-right-spine transform-style-3d ${direction === 'next' ? 'animate-page-flip-next' : 'animate-page-flip-prev'}`}
                        >
                            <StoryPage page={pages[currentPage]} pageIndex={currentPage} totalPages={pages.length} />
                            
                            {pages[currentPage].type === 'end' && (
                                <div className="absolute bottom-16 left-0 right-0 flex justify-center z-50">
                                     <button onClick={() => { stopAudioDirectly(); onClose(); }} className="px-12 py-4 bg-rose-600 text-white rounded-full font-bold hover:bg-rose-700 transition shadow-2xl animate-pulse">
                                        إغلاق الكتاب ✨
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full max-w-lg flex justify-between items-center mt-8 px-6 z-10">
                 <button 
                    onClick={() => navigate('prev')} 
                    disabled={currentPage === 0 || isAnimating}
                    className="text-white bg-white/5 rounded-full p-4 disabled:opacity-5 hover:bg-white/20 transition-all active:scale-90"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 
                 <div className="text-white/20 text-[10px] font-black tracking-[0.4em] uppercase select-none">
                    Studio Quality Sync
                 </div>

                 <button 
                    onClick={() => navigate('next')} 
                    disabled={currentPage === pages.length - 1 || isAnimating}
                    className="text-white bg-white/5 rounded-full p-4 disabled:opacity-5 hover:bg-white/20 transition-all active:scale-90"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 </button>
             </div>

             <style>{`
                .perspective-2000 { perspective: 3000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .origin-right-spine { transform-origin: right center; }
                
                @keyframes pageFlipNext {
                    0% { transform: rotateY(90deg); filter: brightness(0.4); }
                    100% { transform: rotateY(0deg); filter: brightness(1); }
                }

                @keyframes pageFlipPrev {
                    0% { transform: rotateY(-90deg); filter: brightness(0.4); transform-origin: left center; }
                    100% { transform: rotateY(0deg); filter: brightness(1); transform-origin: left center; }
                }
                
                .animate-page-flip-next {
                    animation: pageFlipNext 0.75s cubic-bezier(0.2, 0, 0.2, 1) forwards;
                    backface-visibility: hidden;
                }

                .animate-page-flip-prev {
                    animation: pageFlipPrev 0.75s cubic-bezier(0.2, 0, 0.2, 1) forwards;
                    backface-visibility: hidden;
                }
             `}</style>
        </div>
    );
};
