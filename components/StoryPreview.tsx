import React, { useState, useRef } from 'react';
import { Story, PdfSettings } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { VideoIcon } from './icons/VideoIcon';
import { generatePdf } from '../utils/pdfHelper';
import { BookReader } from './BookReader';
import { generateStoryVideo } from '../utils/videoGenerator';
import { getStoryPages } from '../utils/storyHelper';
import { StoryPage } from './StoryPage';

interface StoryPreviewProps {
    story: Story;
}

export const StoryPreview: React.FC<StoryPreviewProps> = ({ story }) => {
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoProgress, setVideoProgress] = useState('');
    const [videoPercent, setVideoPercent] = useState(0);
    const [isBookMode, setIsBookMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    // إعدادات الـ PDF
    const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
        fontFamily: 'Cairo',
        fontSize: 24, 
        fontColor: '#1a1a1a',
        lineHeight: 1.6, 
        margins: 50,
        textAlign: 'right',
        pageSize: 'a4',
        direction: 'rtl',
        backgroundColor: '#ffffff'
    });

    // إعدادات الفيديو المستقلة
    const [videoFontSize, setVideoFontSize] = useState(65);
    const [videoOverlayText, setVideoOverlayText] = useState('');
    const [videoOverlayFontSize, setVideoOverlayFontSize] = useState(40);
    const [videoAspectRatio, setVideoAspectRatio] = useState('9:16');
    const [videoFilter, setVideoFilter] = useState('cinematic');

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        setShowSettings(false);
        try {
            await generatePdf(story.title, pdfSettings.pageSize, pdfSettings.fontFamily);
        } catch (error: any) {
            console.error("Failed to generate PDF", error);
            alert(error.message || "حدث خطأ أثناء إنشاء ملف PDF.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (isGeneratingVideo) return;
        
        setIsGeneratingVideo(true);
        setVideoPercent(0);
        setVideoProgress('بدء تحضير الاستوديو...');
        setShowSettings(false);
        
        abortControllerRef.current = new AbortController();

        try {
            await generateStoryVideo(story, (msg, percent) => {
                setVideoProgress(msg);
                setVideoPercent(percent);
            }, {
                fps: 30,
                textFontSize: videoFontSize,
                overlayText: videoOverlayText,
                overlayFontSize: videoOverlayFontSize,
                aspectRatio: videoAspectRatio,
                filter: videoFilter,
                signal: abortControllerRef.current.signal
            });
            setVideoProgress('تم تحميل الفيديو بنجاح! 🎉');
        } catch (error: any) {
            if (error.message !== 'CANCELLED') {
                console.error("Video Generation Failed", error);
                alert("عذراً، فشل إنشاء الفيديو. يرجى التأكد من أن متصفحك يدعم تسجيل الوسائط.");
            }
        } finally {
            setTimeout(() => {
                setIsGeneratingVideo(false);
                setVideoPercent(0);
                setVideoProgress('');
            }, 2000);
        }
    };

    const storyPages = getStoryPages(story);

    return (
        <div className="bg-white p-4 md:p-8 rounded-3xl shadow-xl border border-rose-100">
            {isBookMode && <BookReader story={story} onClose={() => setIsBookMode(false)} />}
            
            {isGeneratingVideo && (
                <div className="fixed inset-0 z-[100] bg-rose-900/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="mb-6 relative inline-block">
                            <div className="w-24 h-24 border-8 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-rose-600">
                                {Math.round(videoPercent)}%
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 font-storybook">جاري إنتاج فيديو التيك توك</h3>
                        <p className="text-gray-500 mb-6">{videoProgress}</p>
                        
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-8">
                            <div 
                                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
                                style={{ width: `${videoPercent}%` }}
                            ></div>
                        </div>

                        <button 
                            onClick={() => abortControllerRef.current?.abort()}
                            className="text-rose-400 font-bold hover:text-rose-600 transition-colors text-sm"
                        >
                            إلغاء العملية
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 border-b-2 border-rose-50 pb-6">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="p-3 bg-rose-50 rounded-2xl">
                        <BookOpenIcon className="h-8 w-8 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-rose-900 font-storybook">{story.title}</h2>
                        <p className="text-rose-400 text-sm">جاهزة للقراءة والتحميل</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-center">
                    <button onClick={() => setIsBookMode(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-500 text-white font-bold py-3 px-8 rounded-2xl hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all active:scale-95">
                        <span>قراءة سحرية</span>
                    </button>

                    <div className="relative">
                         <button onClick={() => setShowSettings(!showSettings)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 px-8 rounded-2xl hover:bg-slate-900 shadow-lg shadow-slate-100 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                            <span>تخصيص القصة</span>
                        </button>
                        
                        {showSettings && (
                            <div className="absolute top-full mt-4 left-0 sm:right-0 w-full sm:w-96 bg-white border border-rose-100 shadow-2xl rounded-3xl p-6 z-50 text-right animate-in fade-in slide-in-from-top-4">
                                <div className="flex justify-between items-center mb-6 border-b pb-3">
                                    <h4 className="font-bold text-slate-800 text-lg">إعدادات التصدير</h4>
                                    <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-rose-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>

                                <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                                    {/* قسم الـ PDF */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                            <DownloadIcon className="h-4 w-4" />
                                            <span className="text-xs font-black uppercase">إعدادات الـ PDF</span>
                                        </div>
                                        
                                        <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-[11px] font-bold text-emerald-700">حجم خط الـ PDF</label>
                                                <span className="text-xs font-bold text-emerald-600">{pdfSettings.fontSize}px</span>
                                            </div>
                                            <input 
                                                type="range" min="12" max="80" step="1" 
                                                value={pdfSettings.fontSize} 
                                                onChange={(e) => setPdfSettings({...pdfSettings, fontSize: Number(e.target.value)})}
                                                className="w-full h-2 bg-emerald-100 rounded-lg accent-emerald-500 cursor-pointer appearance-none outline-none" 
                                            />
                                        </div>

                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400">لون الخلفية</label>
                                                    <input 
                                                        type="color" 
                                                        value={pdfSettings.backgroundColor} 
                                                        onChange={(e) => setPdfSettings({...pdfSettings, backgroundColor: e.target.value})}
                                                        className="w-full h-10 bg-white border border-gray-200 rounded-xl cursor-pointer p-1" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400">لون الخط</label>
                                                    <input 
                                                        type="color" 
                                                        value={pdfSettings.fontColor} 
                                                        onChange={(e) => setPdfSettings({...pdfSettings, fontColor: e.target.value})}
                                                        className="w-full h-10 bg-white border border-gray-200 rounded-xl cursor-pointer p-1" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* قسم الفيديو */}
                                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                                            <VideoIcon className="h-4 w-4" />
                                            <span className="text-xs font-black uppercase">إعدادات الفيديو (TikTok)</span>
                                        </div>
                                        
                                        <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100 space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-[11px] font-bold text-purple-700">حجم خط الحوار</label>
                                                    <span className="text-xs font-bold text-purple-600">{videoFontSize}px</span>
                                                </div>
                                                <input 
                                                    type="range" min="30" max="150" step="1" 
                                                    value={videoFontSize} 
                                                    onChange={(e) => setVideoFontSize(Number(e.target.value))}
                                                    className="w-full h-2 bg-purple-100 rounded-lg accent-purple-500 cursor-pointer appearance-none outline-none" 
                                                />
                                            </div>

                                            <div className="pt-2 border-t border-purple-100">
                                                <label className="block text-[11px] font-bold text-purple-700 mb-2">أبعاد الفيديو</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button 
                                                        onClick={() => setVideoAspectRatio('9:16')}
                                                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${videoAspectRatio === '9:16' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'}`}
                                                    >
                                                        9:16 (تيك توك)
                                                    </button>
                                                    <button 
                                                        onClick={() => setVideoAspectRatio('16:9')}
                                                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${videoAspectRatio === '16:9' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'}`}
                                                    >
                                                        16:9 (يوتيوب)
                                                    </button>
                                                    <button 
                                                        onClick={() => setVideoAspectRatio('1:1')}
                                                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${videoAspectRatio === '1:1' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'}`}
                                                    >
                                                        1:1 (انستجرام)
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-purple-100">
                                                <label className="block text-[11px] font-bold text-purple-700 mb-2">الفلتر السينمائي</label>
                                                <select 
                                                    value={videoFilter}
                                                    onChange={(e) => setVideoFilter(e.target.value)}
                                                    className="w-full p-2 text-xs font-bold border border-purple-200 rounded-xl bg-white outline-none focus:ring-1 focus:ring-purple-400 text-purple-700"
                                                >
                                                    <option value="cinematic">سينمائي (Cinematic)</option>
                                                    <option value="vintage">كلاسيكي (Vintage)</option>
                                                    <option value="vibrant">حيوي (Vibrant)</option>
                                                    <option value="bw">أبيض وأسود (B&W)</option>
                                                </select>
                                            </div>

                                            <div className="pt-2 border-t border-purple-100">
                                                <label className="block text-[11px] font-bold text-purple-700 mb-2">نص إضافي (Overlay) - مثل @حسابك</label>
                                                <input 
                                                    type="text" 
                                                    value={videoOverlayText}
                                                    onChange={(e) => setVideoOverlayText(e.target.value)}
                                                    placeholder="مثال: @HeroKids"
                                                    className="w-full p-2 text-xs border border-purple-200 rounded-xl bg-white outline-none focus:ring-1 focus:ring-purple-400"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-[11px] font-bold text-purple-700">حجم نص الإضافة</label>
                                                    <span className="text-xs font-bold text-purple-600">{videoOverlayFontSize}px</span>
                                                </div>
                                                <input 
                                                    type="range" min="20" max="100" step="1" 
                                                    value={videoOverlayFontSize} 
                                                    onChange={(e) => setVideoOverlayFontSize(Number(e.target.value))}
                                                    className="w-full h-2 bg-purple-100 rounded-lg accent-purple-500 cursor-pointer appearance-none outline-none" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4">
                                        <button 
                                            onClick={handleGenerateVideo}
                                            disabled={isGeneratingVideo}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-100 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <VideoIcon className="h-5 w-5" />
                                            <span>إنتاج فيديو تيك توك ✨</span>
                                        </button>

                                        <button 
                                            onClick={handleDownloadPdf} 
                                            disabled={isDownloadingPdf}
                                            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <DownloadIcon className="h-5 w-5" />
                                            <span>تحميل ملف PDF</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div id="story-content" className="flex flex-col gap-12 bg-gray-50/50 p-4 md:p-10 rounded-[2rem] border-2 border-dashed border-rose-100">
                {storyPages.map((page, idx) => (
                    <div key={idx} className="story-page shadow-2xl rounded-2xl overflow-hidden w-full aspect-[1/1.414] max-w-[700px] mx-auto bg-white border-8 border-white transition-all duration-300">
                        <StoryPage page={page} settings={pdfSettings} />
                    </div>
                ))}
            </div>
        </div>
    );
};