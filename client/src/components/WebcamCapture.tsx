import React, { useCallback, useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
    onCapture: (imageSrc: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleDevices = useCallback(
        (mediaDevices: MediaDeviceInfo[]) =>
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
        [setDevices]
    );

    useEffect(() => {
        if (navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(handleDevices).catch(err => {
                console.error("Error enumerating devices:", err);
                setError("No se pudieron listar las cámaras: " + err.message);
            });
        } else {
            setError("Tu navegador no soporta acceso a cámaras o no estás en un contexto seguro (HTTPS/localhost).");
        }
    }, [handleDevices]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
            onCapture(imageSrc);
            setError(null);
        } else {
            setError('No se pudo capturar la imagen. Intente nuevamente.');
        }
    }, [webcamRef, onCapture]);

    const retake = () => {
        setImgSrc(null);
        onCapture('');
        setError(null);
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {error && (
                <div className="text-red-500 text-xs bg-red-500/10 px-2 py-1 rounded">
                    {error}
                </div>
            )}

            {devices.length > 1 && !imgSrc && (
                <div className="w-full mb-2">
                    <select
                        value={deviceId as string}
                        onChange={(e) => setDeviceId(e.target.value)}
                        className="w-full bg-black/20 text-xs text-white border border-white/10 rounded-lg px-2 py-1 focus:outline-none"
                    >
                        {devices.map((device, key) => (
                            <option key={key} value={device.deviceId}>
                                {device.label || `Cámara ${key + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {imgSrc ? (
                <div className="relative w-full aspect-[4/3]">
                    <img src={imgSrc} alt="Captured" className="w-full h-full object-cover rounded-xl border border-white/10" />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                            type="button"
                            onClick={retake}
                            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            deviceId: deviceId ? { exact: deviceId as string } : undefined,
                            aspectRatio: 4 / 3
                            // Removed facingMode to prioritize deviceId
                        }}
                        className="w-full h-full object-cover"
                        onUserMedia={() => setError(null)}
                        onUserMediaError={(err) => {
                            console.error('Webcam error:', err);
                            if (typeof err === 'string') {
                                setError(err);
                            } else {
                                setError('Error de acceso a cámara: ' + (err.message || err.name));
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={capture}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gym-primary hover:bg-gym-primary/90 text-white p-3 rounded-full shadow-lg transition-all"
                    >
                        <Camera size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default WebcamCapture;
