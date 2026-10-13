
import React from 'react';

interface LoadingIndicatorProps {
    step: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ step }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-rose-200 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rose-500 mb-6"></div>
            <h2 className="text-2xl font-bold text-rose-700 mb-2">لحظات سحرية قيد الصنع...</h2>
            <p className="text-gray-600">{String(step || 'يرجى الانتظار قليلاً')}</p>
        </div>
    );
};
