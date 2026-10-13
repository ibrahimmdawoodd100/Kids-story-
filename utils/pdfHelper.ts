
declare const jspdf: any;
declare const html2canvas: any;

/**
 * وظيفة للتحقق من جاهزية الخطوط المختارة.
 * تضمن هذه الوظيفة أن الخط المختار (Amiri, Cairo, Lalezar) قد تم تحميله بالكامل
 * في ذاكرة المتصفح قبل البدء في إنشاء الـ PDF.
 */
const checkFontsReady = async (fontFamily: string): Promise<boolean> => {
    try {
        await document.fonts.ready;
        const fontSpec = `12px "${fontFamily}"`;
        
        if (document.fonts.check(fontSpec)) {
            return true;
        }

        const loadedFonts = await document.fonts.load(fontSpec);
        return loadedFonts.length > 0 || document.fonts.check(fontSpec);
    } catch (e) {
        console.error("Font verification failed:", e);
        return false;
    }
};

const waitForImagesToLoad = (element: HTMLElement): Promise<void[]> => {
    const images = Array.from(element.getElementsByTagName('img'));
    const promises = images.map(img => {
        return new Promise<void>((resolve, reject) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Could not load image in PDF: ${img.src.substring(0, 30)}...`));
            setTimeout(resolve, 10000); 
        });
    });
    return Promise.all(promises);
};

/**
 * إنشاء ملف PDF مطابق تماماً لإعدادات المستخدم 100%.
 * لا يسمح بأي تلاعب أو استبدال للخطوط أو الأحجام المحددة.
 */
export const generatePdf = async (
    storyTitle: string, 
    pageSize: 'a4' | 'a5' | 'letter' = 'a4',
    fontFamily: string = 'Cairo'
) => {
    // قاعدة صارمة: إذا لم يتوفر الخط، يتم إيقاف التصدير فوراً.
    const isFontReady = await checkFontsReady(fontFamily);
    
    if (!isFontReady) {
        // محاولة أخيرة قصيرة جداً
        await new Promise(r => setTimeout(r, 300));
        const retryReady = await checkFontsReady(fontFamily);
        
        if (!retryReady) {
            throw new Error(`خطأ حرج: تعذر تطبيق الخط المختار "${fontFamily}" بدقة 100%. تم إيقاف التصدير لضمان الجودة.`);
        }
    }

    const { jsPDF } = jspdf;
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: pageSize,
        hotfixes: ['px_scaling'],
    });

    const storyContent = document.getElementById('story-content');
    if (!storyContent) return;

    try {
        await waitForImagesToLoad(storyContent);
        
        const storyPages = document.querySelectorAll('.story-page') as NodeListOf<HTMLElement>;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < storyPages.length; i++) {
            const page = storyPages[i];
            
            // التقاط الصفحة بدقة فائقة لضمان ثبات الخطوط والأحجام والألوان
            const canvas = await html2canvas(page, {
                scale: 4, // جودة 4X لضمان حدة الخطوط
                useCORS: true,
                logging: false,
                backgroundColor: null,
                width: page.offsetWidth,
                height: page.offsetHeight,
                onclone: (clonedDoc) => {
                    // فرض الخط المختار على النسخة المستنسخة قبل التصوير
                    const clonedPage = clonedDoc.querySelector('.story-page') as HTMLElement;
                    if (clonedPage) {
                        clonedPage.style.fontFamily = `"${fontFamily}", sans-serif`;
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            if (i > 0) pdf.addPage(pageSize, 'p');
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }
        
        const fileName = `${storyTitle.replace(/\s+/g, '_')}_Final_Creative.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error("PDF Export Failed:", error);
        throw error;
    }
};
