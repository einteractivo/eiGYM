import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Apple, X } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
            setIsClosed(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsVisible(false);
            setIsClosed(true);
        }
        setDeferredPrompt(null);
    };

    if (isClosed || (!isVisible && !isIOS)) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 duration-500">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 p-6 rounded-[2rem] shadow-2xl max-w-xs transition-colors relative overflow-hidden group">
                <button 
                    onClick={() => setIsClosed(true)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gym-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Download className="text-gym-primary" size={24} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Instalar eiGYM</h4>
                        <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest leading-relaxed pr-4">
                            {isIOS 
                                ? 'Pulsa el botón compartir y "Añadir a pantalla de inicio"'
                                : 'Accede más rápido instalando la aplicación en tu dispositivo'
                            }
                        </p>
                    </div>
                </div>
                
                {!isIOS ? (
                    <button
                        onClick={handleInstallClick}
                        className="w-full mt-4 bg-gym-primary hover:bg-gym-primary/90 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gym-primary/20 uppercase tracking-widest text-[10px]"
                    >
                        Instalar Ahora
                    </button>
                ) : (
                    <div className="mt-4 flex justify-center gap-4 text-slate-400 dark:text-gray-500 border-t border-gray-100 dark:border-white/5 pt-4">
                        <div className="flex items-center gap-2">
                            <Apple size={16} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">iPhone / iPad</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Smartphone size={16} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Android</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
