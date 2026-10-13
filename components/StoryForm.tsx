
import React, { useState } from 'react';
import { FormData } from '../types';
import { ImageIcon } from './icons/ImageIcon';
import { safeParseInt } from '../utils/numberHelper';

interface StoryFormProps {
    onSubmit: (formData: FormData, imageData: { data: string; mimeType: string; }) => void;
    isLoading: boolean;
}

const processImage = (file: File): Promise<{ data: string; mimeType: string; }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const MAX_SIZE = 1536; 
                let width = img.width;
                let height = img.height;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const base64Data = dataUrl.split(',')[1];
                resolve({ data: base64Data, mimeType: 'image/jpeg' });
            };
            img.onerror = () => reject(new Error("Could not load image."));
        };
        reader.onerror = (error) => reject(error);
    });
};

export const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState<FormData>({
        childName: '',
        storyPrompt: 'قصة عن طفل شجاع يستكشف غابة سحرية',
        age: 5,
        language: 'Arabic',
        numChapters: 3,
        scenesPerChapter: 2,
        voiceName: 'Kore',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (['age', 'numChapters', 'scenesPerChapter'].includes(name)) {
            setFormData(prev => ({ 
                ...prev, 
                [name]: safeParseInt(value)
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('يرجى اختيار ملف صورة صحيح.');
                return;
            }
            setError(null);
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            setError('يرجى رفع صورة للطفل.');
            return;
        }
        if (!formData.childName.trim()) {
            setError('يرجى إدخال اسم الطفل.');
            return;
        }
        setError(null);
        
        try {
            const imageData = await processImage(imageFile);
            onSubmit(formData, imageData);
        } catch (err) {
            setError('فشلت معالجة الصورة. يرجى المحاولة بصورة أخرى.');
        }
    };

    const voices = [
        { id: 'Kore', name: 'لولو السعيدة', desc: 'صوت أنثوي هادئ ولطيف', gender: 'Female', color: 'bg-pink-100' },
        { id: 'Zephyr', name: 'زوزو المرح', desc: 'صوت صبياني مليء بالحيوية', gender: 'Male', color: 'bg-blue-100' },
        { id: 'Puck', name: 'بندق الصغير', desc: 'صوت ودود يحب المغامرة', gender: 'Male', color: 'bg-orange-100' },
        { id: 'Charon', name: 'العم حكيم', desc: 'صوت عميق ومطمئن للقصص', gender: 'Male', color: 'bg-purple-100' },
        { id: 'Fenrir', name: 'فارس الشجاع', desc: 'صوت قوي وواثق', gender: 'Male', color: 'bg-emerald-100' },
    ];

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg space-y-6 border border-rose-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #fee2e2; border-radius: 10px; }
            `}</style>
            
            <div>
                <label className="block text-lg font-bold text-rose-800 mb-2">1. صورة بطل القصة</label>
                <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-rose-300 border-dashed rounded-xl transition-colors hover:border-rose-400">
                    <div className="space-y-1 text-center">
                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img src={imagePreview} alt="معاينة" className="mx-auto h-32 w-32 object-cover rounded-2xl shadow-md" />
                                <button 
                                    type="button"
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-transform hover:scale-110"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ) : (
                            <ImageIcon className="mx-auto h-12 w-12 text-rose-400" />
                        )}
                        <div className="flex text-sm text-gray-600 justify-center mt-2">
                            <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-bold text-rose-600 hover:text-rose-500 focus-within:outline-none underline decoration-2 underline-offset-4">
                                <span>اختر صورة الطفل</span>
                                <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">سيتم الحفاظ على ملامح وشكل الطفل الحقيقي</p>
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="childName" className="block text-lg font-bold text-rose-800 mb-2">2. اسم البطل</label>
                <input
                    type="text"
                    id="childName"
                    name="childName"
                    className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                    placeholder="مثال: حمودي، سوسو..."
                    value={formData.childName}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div>
                <label htmlFor="storyPrompt" className="block text-lg font-bold text-rose-800 mb-2">3. ماذا سيحدث في القصة؟</label>
                <textarea
                    id="storyPrompt"
                    name="storyPrompt"
                    rows={3}
                    className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="مغامرة في الفضاء، رحلة لجزيرة الكنوز..."
                    value={formData.storyPrompt}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="age" className="block text-sm font-bold text-rose-800 mb-2">4. عمر الطفل</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        id="age"
                        name="age"
                        className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                        value={formData.age === 0 ? '' : formData.age}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="language" className="block text-sm font-bold text-rose-800 mb-2">5. اللغة</label>
                    <select
                        id="language"
                        name="language"
                        className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                        value={formData.language}
                        onChange={handleInputChange}
                    >
                        <option value="Arabic">العربية</option>
                        <option value="English">English</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-lg font-bold text-rose-800 mb-3">6. اختر صوت الراوي</label>
                <div className="grid grid-cols-1 gap-3">
                    {voices.map((voice) => (
                        <div 
                            key={voice.id}
                            onClick={() => setFormData(p => ({ ...p, voiceName: voice.id }))}
                            className={`relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${formData.voiceName === voice.id ? 'border-rose-500 bg-rose-50 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-rose-200 bg-white'}`}
                        >
                            <div className={`h-12 w-12 rounded-full ${voice.color} flex items-center justify-center text-xl shadow-inner`}>
                                {voice.gender === 'Female' ? '👧' : '👦'}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm ${formData.voiceName === voice.id ? 'text-rose-700' : 'text-gray-700'}`}>{voice.name}</h4>
                                <p className="text-xs text-gray-400">{voice.desc}</p>
                            </div>
                            {formData.voiceName === voice.id && (
                                <div className="bg-rose-500 text-white rounded-full p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-lg font-bold text-rose-800 mb-2">7. حجم القصة</label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <label htmlFor="numChapters" className="block text-[10px] font-bold text-gray-500 mb-1">عدد الفصول</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            id="numChapters"
                            name="numChapters"
                            className="w-full bg-transparent font-bold text-rose-700 outline-none"
                            value={formData.numChapters === 0 ? '' : formData.numChapters}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <label htmlFor="scenesPerChapter" className="block text-[10px] font-bold text-gray-500 mb-1">مشاهد / فصل</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            id="scenesPerChapter"
                            name="scenesPerChapter"
                            className="w-full bg-transparent font-bold text-rose-700 outline-none"
                            value={formData.scenesPerChapter === 0 ? '' : formData.scenesPerChapter}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {String(error)}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative overflow-hidden flex justify-center items-center gap-3 bg-rose-500 text-white font-bold py-4 px-6 rounded-2xl hover:bg-rose-600 transition duration-300 disabled:bg-rose-200 shadow-lg shadow-rose-200"
            >
                <span className="relative z-10">{isLoading ? 'جاري تجهيز سحر القصة...' : 'ابدأ المغامرة السحرية'}</span>
                {!isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                )}
            </button>
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer { animation: shimmer 1.5s infinite; }
            `}</style>
        </form>
    );
};
