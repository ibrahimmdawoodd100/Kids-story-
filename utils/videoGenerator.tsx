import React from 'react';
import { Story } from '../types';
import { getStoryPages } from './storyHelper';

const TRANSITION_MS = 400; // وقت الانتقال بين اللقطات
const ZOOM_START = 1.0;
const ZOOM_END = 1.3;

const getSupportedMimeType = () => {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
    for (const type of types) if (MediaRecorder.isTypeSupported(type)) return type;
    return '';
};

const applyFilter = (ctx: CanvasRenderingContext2D, width: number, height: number, filter: string) => {
    if (filter === 'cinematic') {
        // 1. Vignette Effect (عمق سينمائي)
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, width / 4,
            width / 2, height / 2, height * 0.7
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. High-End Color Correction (لمسة دافئة خفيفة)
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255, 150, 50, 0.05)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

        // 3. Subtle Film Grain
        ctx.globalAlpha = 0.02;
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1.0;
    } else if (filter === 'vintage') {
        // Sepia tone
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = 'rgba(112, 66, 20, 0.4)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        
        // Vignette
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, width / 3,
            width / 2, height / 2, height * 0.8
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Heavy Grain
        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.fillStyle = 'black';
            ctx.fillRect(x, y, 3, 3);
        }
        ctx.globalAlpha = 1.0;
    } else if (filter === 'vibrant') {
        // Saturation boost (simulated with overlay)
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        
        // Contrast boost
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
    } else if (filter === 'bw') {
        // Black and White
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
    }
};

const drawTikTokCaptions = (ctx: CanvasRenderingContext2D, text: string, fontSize: number, width: number, height: number) => {
    if (!text) return;
    const words = text.split(' ');
    const maxWidth = width * 0.85;
    const lineHeight = fontSize * 1.5;
    const lines = [];
    let currentLine = '';

    ctx.font = `bold ${fontSize}px 'Cairo', sans-serif`;
    
    for (const word of words) {
        const testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine.trim());

    const totalHeight = lines.length * lineHeight;
    let y = (height * 0.82) - (totalHeight / 2);

    lines.forEach(line => {
        const textWidth = ctx.measureText(line).width;
        const x = width / 2;
        
        // TikTok Style Background Box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        const paddingH = fontSize * 0.5;
        const paddingV = fontSize * 0.2;
        const boxWidth = textWidth + paddingH * 2;
        const boxHeight = lineHeight * 0.9;
        
        ctx.beginPath();
        ctx.roundRect(x - boxWidth / 2, y - boxHeight * 0.78, boxWidth, boxHeight, 12);
        ctx.fill();

        // Glow effect for text
        ctx.shadowColor = 'rgba(255,255,255,0.2)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(line, x, y);
        ctx.shadowBlur = 0;
        
        y += lineHeight;
    });
};

const drawGlobalOverlay = (ctx: CanvasRenderingContext2D, text: string, fontSize: number, width: number, height: number) => {
    if (!text) return;
    ctx.save();
    ctx.font = `bold ${fontSize}px 'Cairo', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    // رسم النص في أعلى الفيديو قليلاً ليكون كعلامة مائية أو عنوان ثانوي
    ctx.fillText(text, width / 2, 120);
    ctx.restore();
};

const loadAudio = async (url: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    if (!url) return audioContext.createBuffer(1, 44100, 44100);
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return await audioContext.decodeAudioData(buf);
};

export const generateStoryVideo = async (
    story: Story, 
    onProgress: (msg: string, percent: number) => void,
    config: any
): Promise<void> => {
    const { 
        fps = 30, 
        bitrate = 20000000, 
        textFontSize = 65, 
        overlayText = '', 
        overlayFontSize = 40, 
        aspectRatio = '9:16',
        filter = 'cinematic',
        signal 
    } = config;
    
    let videoWidth = 1080;
    let videoHeight = 1920;

    if (aspectRatio === '16:9') {
        videoWidth = 1920;
        videoHeight = 1080;
    } else if (aspectRatio === '1:1') {
        videoWidth = 1080;
        videoHeight = 1080;
    }

    const mimeType = getSupportedMimeType();
    
    onProgress("تجهيز الاستوديو السينمائي...", 5);
    
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioContext.createMediaStreamDestination();
    
    const videoStream = canvas.captureStream(fps);
    const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const recorder = new MediaRecorder(combinedStream, { 
        mimeType, 
        videoBitsPerSecond: bitrate 
    }); 
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise(async (resolve, reject) => {
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Trend_Story_${Date.now()}.mp4`;
            a.click();
            audioContext.close();
            resolve();
        };

        recorder.start();
        const pages = getStoryPages(story);

        try {
            for (let i = 0; i < pages.length; i++) {
                if (signal?.aborted) throw new Error("CANCELLED");
                const page = pages[i];
                onProgress(`إخراج المشهد ${i + 1} بجودة عالية...`, 10 + (i / pages.length) * 85);

                const audioBuf = await loadAudio(page.audioUrl || '', audioContext);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuf;
                source.connect(dest);
                source.start();

                const img = new Image();
                if (page.imageUrl) {
                    img.src = page.imageUrl;
                    await new Promise(r => img.onload = r);
                }

                const panDirectionX = (i % 3 - 1) * 40; 
                const panDirectionY = (i % 2 === 0 ? 1 : -1) * 30;
                const durationMs = audioBuf.duration * 1000;
                const startTime = performance.now();
                
                while (true) {
                    const elapsed = performance.now() - startTime;
                    if (elapsed >= durationMs) break;

                    const p = elapsed / durationMs;
                    
                    // Ultra-Smooth Camera Motion
                    const scale = ZOOM_START + (p * (ZOOM_END - ZOOM_START));
                    const currentPanX = p * panDirectionX;
                    const currentPanY = p * panDirectionY;

                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, videoWidth, videoHeight);

                    if (page.imageUrl) {
                        const imgRatio = img.width / img.height;
                        const canvasRatio = videoWidth / videoHeight;
                        
                        let drawW, drawH;
                        if (imgRatio > canvasRatio) {
                            drawH = videoHeight;
                            drawW = videoHeight * imgRatio;
                        } else {
                            drawW = videoWidth;
                            drawH = videoWidth / imgRatio;
                        }

                        const finalW = drawW * scale;
                        const finalH = drawH * scale;

                        ctx.save();
                        ctx.translate(videoWidth / 2 + currentPanX, videoHeight / 2 + currentPanY);
                        ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);
                        ctx.restore();
                    } else {
                        const grad = ctx.createLinearGradient(0, 0, 0, videoHeight);
                        grad.addColorStop(0, '#e11d48');
                        grad.addColorStop(1, '#4c0519');
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, 0, videoWidth, videoHeight);
                    }

                    applyFilter(ctx, videoWidth, videoHeight, filter);
                    drawTikTokCaptions(ctx, page.text || page.title || "", textFontSize, videoWidth, videoHeight);
                    
                    // رسم النص الإضافي (Overlay)
                    drawGlobalOverlay(ctx, overlayText, overlayFontSize, videoWidth, videoHeight);

                    // Smooth Transition Fade
                    if (elapsed > durationMs - TRANSITION_MS) {
                        const fade = (durationMs - elapsed) / TRANSITION_MS;
                        ctx.fillStyle = `rgba(0,0,0,${1 - fade})`;
                        ctx.fillRect(0, 0, videoWidth, videoHeight);
                    }
                    if (elapsed < TRANSITION_MS && i > 0) {
                        const fade = elapsed / TRANSITION_MS;
                        ctx.fillStyle = `rgba(0,0,0,${1 - fade})`;
                        ctx.fillRect(0, 0, videoWidth, videoHeight);
                    }

                    await new Promise(r => requestAnimationFrame(r));
                }
                
                source.stop();
            }
            recorder.stop();
        } catch (e) {
            if (recorder.state !== 'inactive') recorder.stop();
            reject(e);
        }
    });
};