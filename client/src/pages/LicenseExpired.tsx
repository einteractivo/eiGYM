import React, { useState } from 'react';
import { Lock, Phone, Key, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const LicenseExpiredPage: React.FC = () => {
    const [licenseCode, setLicenseCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/settings/license', { licenseJson: licenseCode });
            setSuccess('Licencia activada correctamente. Redirigiendo...');
            localStorage.removeItem('license_expired');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al activar la licencia');
        } finally {
            setLoading(false);
        }
    };

    const handleEnterLimited = () => {
        localStorage.setItem('license_expired', 'true');
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/5">
                <div className="p-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                <div className="p-8 md:p-12">
                    <div className="flex justify-center mb-8">
                        <div className="bg-red-500/10 p-5 rounded-full ring-8 ring-red-500/5 animate-pulse">
                            <Lock className="w-14 h-14 text-red-500" />
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tight">
                            Licencia <span className="text-red-500">Expirada</span>
                        </h1>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">
                            La suscripción de su sistema <span className="text-white font-bold italic">eiGYM</span> ha caducado. 
                            Por favor, ingrese un nuevo código de activación o contacte a soporte.
                        </p>
                    </div>

                    <form onSubmit={handleActivate} className="space-y-4 mb-10">
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <textarea
                                value={licenseCode}
                                onChange={(e) => setLicenseCode(e.target.value)}
                                placeholder="Pegue aquí su nuevo código de licencia JSON..."
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all min-h-[100px] resize-none font-mono"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                                <ShieldAlert size={16} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                                <ShieldAlert size={16} />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 uppercase italic tracking-widest text-sm"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Activar Nueva Licencia</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <button
                            onClick={handleEnterLimited}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-[0.95] italic text-center"
                        >
                            Ingresar (Modo Lectura)
                        </button>
                        <a
                            href="https://wa.me/51952372009"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600/10 hover:bg-green-600/20 text-green-500 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20 flex items-center justify-center gap-2 italic text-center"
                        >
                            <Phone size={14} />
                            Contactar Soporte
                        </a>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-black mb-3 text-center tracking-[0.2em]">ID de Hardware de esta PC:</p>
                        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-white/5">
                            <code className="text-white text-xs break-all select-all font-mono font-bold block flex-1 text-center">
                                {localStorage.getItem('current_machine_id') || 'CARGANDO...'}
                            </code>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center px-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                            Powered by <span className="text-red-500">einteractivo</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicenseExpiredPage;
