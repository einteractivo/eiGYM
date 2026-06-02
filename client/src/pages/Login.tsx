import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            login(token, user);
            
            // Redirection logic based on role
            if (user.role === 'SUPERADMIN') {
                navigate('/saas/gyms');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gym-dark flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gym-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gym-accent/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-white/80 dark:bg-black/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl transition-all">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-slate-900 dark:bg-gym-primary rounded-3xl flex items-center justify-center font-black text-4xl italic shadow-2xl shadow-slate-200 dark:shadow-gym-primary/30 mb-6 text-white dark:text-slate-900 transition-all">
                            ei
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight text-center">Bienvenido a eiGYM</h1>
                        <p className="text-gray-400 dark:text-gray-500 mt-2 font-medium text-center">Inicia sesión para gestionar tu gimnasio</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email Corporativo</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                    placeholder="admin@eigym.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gym-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 dark:bg-gym-primary hover:bg-slate-800 dark:hover:bg-gym-primary/90 text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <LogIn size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-4">
                        <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">¿Aún no tienes una cuenta?</p>
                        <button
                            onClick={() => navigate('/register-gym')}
                            className="text-slate-900 dark:text-gym-primary font-black text-sm uppercase tracking-widest hover:opacity-80 transition-all active:scale-95"
                        >
                            Registra tu gimnasio aquí
                        </button>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <a 
                        href="https://www.eistreaming.net" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 hover:text-gym-primary transition-colors italic group"
                    >
                        <span>Powered by:</span>
                        <span className="text-gray-500 dark:text-gray-400 group-hover:text-gym-primary transition-colors underline decoration-gym-primary/30 decoration-2 underline-offset-4">einteractivo</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
