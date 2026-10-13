
import React from 'react';

export const StoryLogo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`${className} select-none pointer-events-none`}>
            {/* 
               Colorful "Little Hero" Logo Recreation 
            */}
            <svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FDBA74" />
                        <stop offset="100%" stopColor="#FB923C" />
                    </linearGradient>
                    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#C084FC" />
                        <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                </defs>

                {/* Decorative Stars */}
                <path d="M20 20 L23 28 L31 28 L25 34 L27 42 L20 36 L13 42 L15 34 L9 28 L17 28 Z" fill="#FCD34D" />
                <path d="M280 15 L282 21 L288 21 L283 25 L285 31 L280 27 L275 31 L277 25 L272 21 L278 21 Z" fill="#60A5FA" />

                {/* Book Icon Hint */}
                <path d="M70 15 Q 85 5 100 15 L 100 25 Q 85 15 70 25 Z" fill="none" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" />
                <path d="M100 15 Q 115 5 130 15 L 130 25 Q 115 15 100 25 Z" fill="none" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" />

                {/* Text: صغيري (Blueish) */}
                <text x="220" y="70" fontFamily="Lalezar" fontSize="60" textAnchor="end" fill="url(#blueGrad)" stroke="white" strokeWidth="4" paintOrder="stroke">صغيري</text>
                
                {/* Text: بطل (Orange/Purple mix) */}
                <text x="80" y="70" fontFamily="Lalezar" fontSize="60" textAnchor="start" fill="url(#orangeGrad)" stroke="white" strokeWidth="4" paintOrder="stroke">بطل</text>
            </svg>
        </div>
    );
};
