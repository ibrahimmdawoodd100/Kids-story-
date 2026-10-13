import { GoogleGenAI, Modality, Type } from "@google/genai";
import { FormData, Story, Scene, Chapter } from '../types';
import { base64ToWav } from '../utils/audioHelper';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = 4,
    initialDelay: number = 6000,
    operationName: string = "Operation"
): Promise<T> {
    let currentDelay = initialDelay;
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const isRateLimit = 
                error?.status === 429 || 
                error?.code === 429 || 
                error?.status === 'RESOURCE_EXHAUSTED' ||
                (error?.message && (
                    error.message.includes('429') || 
                    error.message.includes('quota') || 
                    error.message.includes('RESOURCE_EXHAUSTED')
                ));
            
            const isServerError = error?.status >= 500 || (error?.message && error.message.includes('50'));
            
            if (isRateLimit || isServerError) {
                console.warn(`${operationName} failed with ${isRateLimit ? 'rate limit' : 'server error'}. Retrying in ${currentDelay}ms...`);
                await wait(currentDelay);
                currentDelay *= 1.5;
                continue;
            }
            console.error(`${operationName} failed with non-retriable error:`, error);
            throw error;
        }
    }
    throw new Error(`${operationName} failed after retries`);
}

const generateStoryText = async (formData: FormData): Promise<Story> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { age, language, storyPrompt, numChapters, scenesPerChapter, childName } = formData;
    
    const systemInstruction = `أنت خبير في إنتاج قصص الأطفال المصورة باحترافية عالمية (Disney/Pixar standard).

=== STORY STRUCTURE REQUIREMENTS ===
1. NARRATIVE ARC (قوس السرد):
- SETUP - عرض البطل، عالمه العادي، وشخصيته
- INCITING INCIDENT - حدث يغير كل شيء
- RISING ACTION - سلسلة تحديات متصاعدة
- CLIMAX - الذروة الدرامية والتحدي الأكبر
- RESOLUTION - الحل والدرس المستفاد
- DENOUEMENT - العودة للحياة بتغيير إيجابي
- END - نهاية دافئة ومرضية

2. CHARACTER DEVELOPMENT:
- البطل: شخصية واضحة بنقاط قوة وضعف
- الشخصيات المساعدة: 2-3 شخصيات داعمة مميزة
- الخصم/التحدي: واضح ومناسب للعمر
- تطور الشخصية: يجب أن يتغير البطل ويتعلم

3. DIALOGUE RULES:
- استخدم حوار طبيعي بين الشخصيات
- 60% حوار + 40% سرد
- اجعل كل شخصية لها طريقة كلام مميزة
- استخدم علامات التعجب والاستفهام لإضفاء الحيوية

=== VISUAL PRODUCTION STANDARDS ===
1. IMAGE GENERATION PROMPTS:
For EACH scene's image_prompt, use this detailed structure IN ENGLISH:
"Create a children's book illustration in Disney/Pixar style:
- SCENE: [Detailed scene description]
- CHARACTERS: [Characters, appearance, expressions]
- ENVIRONMENT: [Rich environment details]
- LIGHTING: [Lighting and atmosphere]
- CAMERA ANGLE: [wide shot, close-up, bird's eye, etc.]
- COLOR PALETTE: [Appropriate color palette]
- EMOTIONAL TONE: [Emotions to convey]
- STYLE: Cinematic, vibrant colors, soft lighting, detailed textures, magical atmosphere
- QUALITY: 8K, professional children's book illustration, publish-ready"

2. VISUAL VARIETY REQUIREMENTS:
- لقطات متنوعة: wide shots, medium shots, close-ups
- زوايا متنوعة: eye-level, low-angle, high-angle, over-the-shoulder

=== CONTENT QUALITY STANDARDS ===
1. AGE-APPROPRIATE CONTENT:
- العمر المستهدف: ${age} سنوات
- لغة بسيطة وواضحة
- جمل قصيرة
- مفردات غنية لكن مفهومة

2. EDUCATIONAL VALUE:
- درس أخلاقي واضح لكن غير واعظ
- قيم إيجابية: شجاعة، صداقة، لطف، مثابرة
- تشجيع الفضول والاستكشاف

3. EMOTIONAL ENGAGEMENT:
- اخلق تعاطفاً مع البطل
- استخدم المفاجآت والتشويق
- نهاية مُرضية عاطفياً`;

    const prompt = `Create an exciting story for a ${age}-year-old named "${childName}" in ${language}. Theme: ${storyPrompt}. IMPORTANT: The child is the main hero. EXACTLY ${numChapters} chapters, ${scenesPerChapter} scenes each. Output JSON only matching the schema.`;

    return retryOperation(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview', // Using Pro for complex reasoning and story structure
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        chapters: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    chapter_number: { type: Type.INTEGER },
                                    title: { type: Type.STRING },
                                    scenes: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                scene_number: { type: Type.INTEGER },
                                                text: { type: Type.STRING },
                                                image_prompt: { type: Type.STRING },
                                                layout_type: { 
                                                    type: Type.STRING, 
                                                    description: "Choose layout: 'full-image' (for wide epic shots), 'split' (standard 50/50), or 'text-heavy' (for dialogue/exposition)"
                                                },
                                                design_notes: { type: Type.STRING }
                                            },
                                            required: ["scene_number", "text", "image_prompt", "layout_type", "design_notes"]
                                        },
                                    },
                                },
                                required: ["chapter_number", "title", "scenes"]
                            },
                        },
                    },
                    required: ["title", "chapters"]
                },
            },
        });
        
        let text = response.text || "{}";
        if (text.startsWith('```json')) {
            text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        try {
            return JSON.parse(text) as Story;
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            throw new Error(`Invalid JSON from AI: ${e}`);
        }
    }, 3, 5000, "Generate Story Script");
};

const generateImageForScene = async (prompt: string, baseImg: string, mime: string, aspectRatio: string = "1:1"): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const editingPrompt = `You are a world-class photo editor.
    TASK: Place the EXACT child from the provided photo into a new environment.
    
    CRITICAL RULES:
    1. DO NOT change the child's face, hair, or identity. The child must look EXACTLY like the original photo.
    2. Place the child in this scene: ${prompt}.
    3. Ensure photorealistic integration with matching lighting and shadows.
    4. NO TEXT, NO WATERMARKS, NO LETTERS in the image.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [
                    { inlineData: { data: baseImg, mimeType: mime } }, 
                    { text: editingPrompt }
                ] 
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio
                }
            }
        });
        
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return "";
    } catch (e) { 
        console.error("Image generation failed", e);
        return ""; 
    }
};

const generateAudioSegment = async (text: string, voiceName: string): Promise<string | undefined> => {
    if (!text.trim()) return undefined;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        return await retryOperation(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: { parts: [{ text: text }] },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { 
                        voiceConfig: { 
                            prebuiltVoiceConfig: { 
                                voiceName: voiceName 
                            } 
                        } 
                    },
                },
            });
            const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (!base64) return undefined;
            return URL.createObjectURL(base64ToWav(base64, 24000));
        }, 1, 2000, "Generate TTS Audio");
    } catch { return undefined; }
};

export const generateStoryWorkflow = async (formData: FormData, imageData: any, updateStep: any): Promise<Story> => {
    updateStep("جاري كتابة مغامرتك السحرية...");
    const story = await generateStoryText(formData);
    const chapters: Chapter[] = [];
    
    updateStep("جاري تحضير صوت الراوي...");
    const titleAudio = await generateAudioSegment(`قصة ${story.title}. بطلنا هو ${formData.childName}!`, formData.voiceName);

    updateStep("جاري تصميم غلاف القصة...");
    const coverPrompt = `A cinematic, magical book cover artwork for a story. The main hero is a ${formData.age}-year-old child named ${formData.childName}. The theme is ${formData.storyPrompt}. IMPORTANT: DO NOT include any text, titles, words, or letters in the image. The image must be completely text-free artwork.`;
    const coverImageUrl = await generateImageForScene(coverPrompt, imageData.data, imageData.mimeType, "3:4");

    for (const ch of story.chapters) {
        const scenes: Scene[] = [];
        for (const sc of ch.scenes) {
            updateStep(`جاري دمج بطلنا في المشهد ${sc.scene_number}...`);
            const [img, aud] = await Promise.all([
                generateImageForScene(sc.image_prompt, imageData.data, imageData.mimeType),
                generateAudioSegment(sc.text, formData.voiceName)
            ]);
            scenes.push({ ...sc, imageUrl: img, audioUrl: aud });
        }
        chapters.push({ ...ch, scenes });
    }
    
    return { ...story, chapters, titleAudioUrl: titleAudio, coverImageUrl };
};