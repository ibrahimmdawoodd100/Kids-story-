
import React from 'react';
import { PageData } from '../utils/storyHelper';
import { PdfSettings } from '../types';

interface StoryPageProps {
    page: PageData;
    pageIndex?: number;
    totalPages?: number;
    settings?: PdfSettings;
}

export const StoryPage: React.FC<StoryPageProps> = ({ page, settings }) => {
    // القيم الافتراضية إذا لم يتم تمرير إعدادات
    const s = settings || {
        fontFamily: 'Cairo',
        fontSize: 24,
        fontColor: '#1a1a1a',
        lineHeight: 1.6,
        margins: 50,
        textAlign: 'right' as const,
        pageSize: 'a4' as const,
        direction: 'rtl' as const,
        backgroundColor: '#ffffff'
    };

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: s.backgroundColor,
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        direction: s.direction,
        padding: `${s.margins}px`,
        boxSizing: 'border-box'
    };

    const textStyle: React.CSSProperties = {
        fontFamily: s.fontFamily,
        fontSize: `${s.fontSize}px`,
        color: s.fontColor,
        lineHeight: s.lineHeight,
        textAlign: s.textAlign,
        fontWeight: 'bold',
        wordBreak: 'break-word'
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: s.fontFamily,
        fontSize: `${s.fontSize * 1.6}px`,
        color: s.fontColor,
        textAlign: 'center',
        marginBottom: '1.5rem',
        fontWeight: 'bold',
        lineHeight: 1.2,
    };

    switch (page.type) {
        case 'cover':
            return (
                <div style={{...containerStyle, padding: 0, backgroundColor: '#000'}} className="relative flex flex-col items-center justify-center text-center overflow-hidden">
                    {page.imageUrl && (
                        <div className="absolute inset-0 w-full h-full">
                            <img src={page.imageUrl} className="w-full h-full object-cover opacity-90" alt="Cover Background" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent"></div>
                        </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full w-full py-16 px-12">
                        <h1 style={{
                            fontFamily: s.fontFamily, 
                            fontSize: `${s.fontSize * 2.8}px`, 
                            color: '#ffffff',
                            textShadow: '0 4px 20px rgba(0,0,0,0.9)',
                            lineHeight: 1.3,
                            fontWeight: 900,
                            padding: '0 20px'
                        }}>
                            {page.title}
                        </h1>
                    </div>
                </div>
            );

        case 'scene':
            if (page.layoutType === 'full-image') {
                return (
                    <div style={{...containerStyle, padding: 0, backgroundColor: '#000'}} className="relative flex flex-col items-center justify-end text-center overflow-hidden">
                        {page.imageUrl && (
                            <div className="absolute inset-0 w-full h-full">
                                <img src={page.imageUrl} className="w-full h-full object-cover" alt="Scene" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            </div>
                        )}
                        <div className="relative z-10 w-full p-8 pb-12">
                            <p style={{...textStyle, margin: 0, color: '#ffffff', fontSize: `${s.fontSize * 0.9}px`, lineHeight: 1.6, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>
                                {page.text}
                            </p>
                        </div>
                    </div>
                );
            }
            
            if (page.layoutType === 'text-heavy') {
                return (
                    <div style={{...containerStyle, padding: 0}}>
                        <div className="h-[35%] w-full relative shrink-0">
                            {page.imageUrl && <img src={page.imageUrl} className="w-full h-full object-cover" alt="Scene" />}
                        </div>
                        <div className="h-[65%] w-full flex flex-col justify-center bg-white" style={{ padding: `${s.margins}px`, backgroundColor: s.backgroundColor }}>
                             <p style={{...textStyle, margin: 0, fontSize: `${s.fontSize * 0.8}px`, lineHeight: 1.8}}>
                                {page.text}
                            </p>
                        </div>
                    </div>
                );
            }

            // Default 'split' layout
            return (
                <div style={{...containerStyle, padding: 0}}>
                    <div className="h-[45%] w-full relative shrink-0">
                        {page.imageUrl && <img src={page.imageUrl} className="w-full h-full object-cover" alt="Scene" />}
                    </div>
                    <div className="h-[55%] w-full flex flex-col justify-center bg-white" style={{ padding: `${s.margins}px`, backgroundColor: s.backgroundColor }}>
                         <p style={{...textStyle, margin: 0, fontSize: `${s.fontSize * 0.85}px`, lineHeight: 1.7}}>
                            {page.text}
                        </p>
                    </div>
                </div>
            );

        case 'chapter_title':
        case 'end':
            return (
                <div style={{...containerStyle, backgroundColor: s.fontColor === '#1a1a1a' ? '#f43f5e' : s.fontColor, color: s.backgroundColor}} className="items-center justify-center text-center">
                    <h2 style={{...titleStyle, color: s.backgroundColor, fontSize: `${s.fontSize * 2.4}px`}}>
                        {page.title}
                    </h2>
                    {page.text && (
                        <p style={{...textStyle, color: s.backgroundColor, textAlign: 'center', marginTop: '1rem'}}>
                            {page.text}
                        </p>
                    )}
                </div>
            );

        default: return null;
    }
};
