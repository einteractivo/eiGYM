import React from 'react';
import { X, Globe, MessageCircle, Code2, Heart } from 'lucide-react';

interface DeveloperInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DeveloperInfoModal: React.FC<DeveloperInfoModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gym-dark border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="relative h-32 bg-gym-primary flex items-center justify-center overflow-hidden">
                    {/* Background Patterns */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    </div>
                    <Code2 size={48} className="text-white relative z-10" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white mt-1 transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 text-center space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">eiGYM System</h2>
                        <p className="text-gym-primary font-bold uppercase tracking-widest text-xs mt-1">Versión 1.0.2</p>
                    </div>

                    <div className="space-y-4 text-gray-400">
                        <p className="text-sm leading-relaxed">
                            Una plataforma integral diseñada para la gestión eficiente de gimnasios,
                            optimizando el control de socios, inventario y asistencias biométricas.
                        </p>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Desarrollado por</p>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                            <h3 className="text-lg font-black text-white italic">
                                EINTERACTIVO!NET
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">negocios digitales</p>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        <a
                            href="https://www.eistreaming.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white/5 hover:bg-gym-primary hover:text-white rounded-2xl transition-all text-gray-400"
                            title="Visitar Web"
                        >
                            <Globe size={20} />
                        </a>
                        <a
                            href="https://wa.me/51952372009"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white/5 hover:bg-gym-primary hover:text-white rounded-2xl transition-all text-gray-400"
                            title="WhatsApp"
                        >
                            <MessageCircle size={20} />
                        </a>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-600 font-bold uppercase tracking-widest pt-4">
                        Made with <Heart size={10} className="text-red-500 fill-red-500" /> for fitness enthusiasts
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperInfoModal;
