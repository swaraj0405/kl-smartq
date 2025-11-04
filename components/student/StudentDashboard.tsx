import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Token, TokenStatus, Priority, User } from '../../types';
import { QrCodeIcon, TicketIcon } from '../common/Icons';

const ScannerModal: React.FC<{
    token: Token;
    onClose: () => void;
    onScanSuccess: (tokenId: string) => void;
}> = ({ token, onClose, onScanSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
    const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'prompt' | 'denied'>('checking');
    const [error, setError] = useState('');
    const [scanFeedback, setScanFeedback] = useState('');

    useEffect(() => {
        const checkCameraPermission = async () => {
            if (navigator.permissions) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    setPermissionState(permissionStatus.state);
                    permissionStatus.onchange = () => {
                        setPermissionState(permissionStatus.state);
                    };
                } catch (err) {
                    console.warn("Could not query camera permissions. Proceeding with default behavior.", err);
                    setPermissionState('prompt'); // Fallback
                }
            } else {
                 console.warn("Permissions API not supported. Proceeding with default behavior.");
                 setPermissionState('prompt'); // Fallback
            }
        };
        checkCameraPermission();
    }, []);

    const stopCamera = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const handleClose = useCallback(() => {
        stopCamera();
        onClose();
    }, [stopCamera, onClose]);

    const scanQRCode = useCallback(() => {
        if (typeof (window as any).jsQR === 'undefined') {
            animationFrameId.current = requestAnimationFrame(scanQRCode);
            return;
        }
    
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
    
            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height);
    
                if (code) {
                    try {
                        const qrData = JSON.parse(code.data);
                        if (qrData.type === 'office-checkin' && qrData.officeId === token.officeId) {
                            onScanSuccess(token.id);
                            return; // Stop scanning on success
                        } else {
                            setScanFeedback('Wrong QR code. Please scan again.');
                            setTimeout(() => setScanFeedback(''), 2000);
                        }
                    } catch (e) {
                         setScanFeedback('Invalid QR code. Please scan again.');
                         setTimeout(() => setScanFeedback(''), 2000);
                    }
                }
            }
        }
        animationFrameId.current = requestAnimationFrame(scanQRCode);
    }, [token.officeId, token.id, onScanSuccess]);

    const activateCamera = async () => {
        if (streamRef.current || cameraState === 'requesting') return;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            setCameraState('requesting');
            setError('');
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                setCameraState('active');
            } catch (err) {
                console.error("Error accessing camera:", err);
                if (err instanceof Error) {
                     if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setError('Camera permission was denied. Please allow camera access in your browser settings to continue.');
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        setError('No camera found on this device. Please use a device with a camera.');
                    } else {
                        setError(`An unexpected error occurred: ${err.message}`);
                    }
                } else {
                    setError('An unknown error occurred while accessing the camera.');
                }
                setCameraState('error');
                stopCamera();
            }
        } else {
            setError('Your browser does not support camera access.');
            setCameraState('error');
        }
    };
    
    // Effect to attach stream and start scanning AFTER the video element has rendered
    useEffect(() => {
        if (cameraState === 'active' && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            if(videoRef.current.paused){
                 videoRef.current.play().catch(e => {
                    console.error("Error playing video:", e);
                    setError("Could not play video stream. Please check browser permissions.");
                    setCameraState('error');
                });
            }
            animationFrameId.current = requestAnimationFrame(scanQRCode);
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [cameraState, scanQRCode]);

    // Cleanup on component unmount
    useEffect(() => {
        return stopCamera;
    }, [stopCamera]);

    const renderContent = () => {
        if (cameraState === 'active') {
             return (
                 <>
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover absolute inset-0" 
                        playsInline 
                        autoPlay
                        muted
                    />
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <style>{`
                            @keyframes scan-animation {
                                0% { top: 0; }
                                100% { top: calc(100% - 4px); }
                            }
                            .animate-scan-line {
                                animation: scan-animation 3s linear infinite alternate;
                            }
                        `}</style>
                        <div className="relative w-full h-full">
                            <div className="absolute left-0 w-full h-1 bg-red-500/90 shadow-[0_0_15px_2px_rgba(255,0,0,0.8)] animate-scan-line"></div>
                        </div>
                    </div>
                     {scanFeedback && (
                        <div className="absolute inset-x-0 bottom-4 text-center">
                            <p className="bg-red-500/80 text-white font-semibold py-2 px-4 rounded-lg inline-block">{scanFeedback}</p>
                        </div>
                    )}
                </>
             );
        }

        if (cameraState === 'error') {
            return (
                <div className="text-red-400 bg-red-50 p-4 rounded-lg w-full">
                   <p className="font-bold mb-2">Camera Error</p>
                   <p className="text-sm">{error}</p>
                   {error.includes('permission was denied') && (
                        <p className="text-xs mt-2">You may need to go into your browser's site settings to re-enable camera access for this page.</p>
                   )}
                </div>
            );
        }

        if (cameraState === 'requesting' || permissionState === 'checking') {
            return <p className="text-white">Initializing Camera...</p>;
        }

        // Idle state
        return (
            <div className="text-white text-center">
                <QrCodeIcon className="w-16 h-16 mx-auto mb-4 text-neutral-500" />
                {permissionState === 'denied' ? (
                     <>
                        <p className="font-bold text-lg mb-2 text-red-300">Camera Access Denied</p>
                        <p className="text-neutral-300 text-sm">To check in, you must allow camera access in your browser's site settings.</p>
                    </>
                ) : (
                    <>
                        <p className="font-semibold">Camera is required for check-in.</p>
                        <p className="text-sm text-neutral-400">Allow access when prompted.</p>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md text-center">
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">Scan Office QR Code</h2>
                <p className="text-neutral-600 mb-4">Point your camera at the QR code displayed at the office.</p>
                
                <div className="relative w-full aspect-square bg-neutral-800 rounded-lg overflow-hidden my-4 flex items-center justify-center p-4">
                    <canvas ref={canvasRef} className="hidden" />
                    {renderContent()}
                </div>
                
                <div className="mt-6 flex flex-col space-y-3">
                    {cameraState === 'idle' || cameraState === 'error' ? (
                        <button
                            onClick={activateCamera}
                            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed"
                            disabled={permissionState === 'checking'}
                        >
                            {permissionState === 'denied' || cameraState === 'error' ? 'Retry Camera Activation' : 'Activate Camera'}
                        </button>
                    ) : null}
                     <button
                        onClick={handleClose}
                        className="w-full bg-neutral-200 text-neutral-800 font-bold py-3 px-6 rounded-lg hover:bg-neutral-300 transition-all"
                    >
                        {cameraState === 'active' || cameraState === 'requesting' ? 'Cancel Scan' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ActiveTokenCard: React.FC<{ token: Token; currentUser: User | null; onScan: (token: Token) => void }> = ({ token, currentUser, onScan }) => {
    const { offices, tokens } = useAppContext();
    const office = offices.find(o => o.id === token.officeId);
    
    const officeTokens = tokens.filter(t => t.officeId === token.officeId);
    const waitingTokens = officeTokens.filter(t => t.status === TokenStatus.WAITING);
    const inProgressToken = officeTokens.find(t => t.status === TokenStatus.IN_PROGRESS);
    
    const sortedWaitingTokens = [...waitingTokens].sort((a, b) => {
        if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT) return -1;
        if (b.priority === Priority.URGENT && a.priority !== Priority.URGENT) return 1;
        if (a.priority === Priority.MEDICAL && b.priority !== Priority.MEDICAL) return -1;
        if (b.priority === Priority.MEDICAL && a.priority !== Priority.MEDICAL) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const queuePosition = sortedWaitingTokens.findIndex(t => t.id === token.id) + 1;
    const estimatedWait = queuePosition > 0 ? (queuePosition - 1) * 5 : 0; 

    return (
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 flex overflow-hidden font-sans">
            {/* --- Desktop View --- */}
            <div className="hidden md:flex w-full">
                <div className="bg-primary-dark text-white p-6 flex flex-col justify-between w-1/3">
                    <div>
                        <p className="text-sm font-semibold text-blue-200 uppercase tracking-wider">Office</p>
                        <h2 className="text-2xl font-bold">{office?.name}</h2>
                    </div>
                    <div className="my-6">
                        <p className="text-sm text-blue-200 uppercase tracking-wider">Your Token</p>
                        <p className="text-5xl font-extrabold tracking-tighter">{token.tokenNumber}</p>
                    </div>
                    <div>
                         <p className="text-sm text-blue-200 uppercase tracking-wider">Purpose</p>
                         <p className="font-medium">{token.purpose}</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="p-6 flex-1">
                         <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-sm text-neutral-500">Student</p>
                                <p className="font-bold text-lg text-neutral-800">{currentUser?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-neutral-500">Your Position</p>
                                <p className="text-5xl font-extrabold text-accent">{queuePosition > 0 ? queuePosition : '-'}</p>
                            </div>
                        </div>
                        
                         <div className="my-6 border-t-2 border-dashed border-neutral-300"></div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-xs text-neutral-500 font-semibold uppercase">Currently Serving</p>
                                <p className="font-bold text-lg text-neutral-700 mt-1">{inProgressToken ? inProgressToken.tokenNumber : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 font-semibold uppercase">Est. Wait</p>
                                <p className="font-bold text-lg text-neutral-700 mt-1">~{estimatedWait} min</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 font-semibold uppercase">Queue Size</p>
                                <p className="font-bold text-lg text-neutral-700 mt-1">{waitingTokens.length}</p>
                            </div>
                        </div>
                    </div>
                    {token.status === TokenStatus.WAITING && (
                        <div className="border-t border-neutral-200">
                            {token.isCheckedIn ? (
                                <div className="text-center font-semibold text-green-700 bg-green-100 py-4">
                                    You are checked in!
                                </div>
                            ) : (
                                <button onClick={() => onScan(token)} className="w-full flex items-center justify-center space-x-2 bg-secondary text-primary-dark font-bold py-4 hover:bg-secondary-dark transition-colors duration-200">
                                    <QrCodeIcon className="w-6 h-6" />
                                    <span>Scan to Check In</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* --- Mobile View --- */}
            <div className="w-full md:hidden flex flex-col">
                <div className="p-4 bg-primary-dark text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Office</p>
                            <h2 className="text-lg font-bold">{office?.name}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-200">Your Position</p>
                            <p className="text-4xl font-extrabold text-white">{queuePosition > 0 ? queuePosition : '-'}</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-500/50">
                        <p className="text-xs text-blue-200 uppercase tracking-wider">Your Token</p>
                        <p className="text-2xl font-extrabold tracking-tighter">{token.tokenNumber}</p>
                    </div>
                </div>

                <div className="p-4 flex-1">
                    <div className="mb-4">
                        <p className="text-sm text-neutral-500">Purpose of Visit</p>
                        <p className="font-semibold text-neutral-800">{token.purpose}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-neutral-100 p-3 rounded-lg">
                        <div>
                            <p className="text-xs text-neutral-500 font-semibold uppercase">Serving</p>
                            <p className="font-bold text-base text-neutral-700 mt-1">{inProgressToken ? inProgressToken.tokenNumber : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 font-semibold uppercase">Est. Wait</p>
                            <p className="font-bold text-base text-neutral-700 mt-1">~{estimatedWait} min</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 font-semibold uppercase">Queue</p>
                            <p className="font-bold text-base text-neutral-700 mt-1">{waitingTokens.length}</p>
                        </div>
                    </div>
                </div>
                
                {token.status === TokenStatus.WAITING && (
                    <div className="mt-auto">
                        {token.isCheckedIn ? (
                            <div className="text-center font-semibold text-green-700 bg-green-100 py-3 text-sm">
                                You are checked in!
                            </div>
                        ) : (
                            <button onClick={() => onScan(token)} className="w-full flex items-center justify-center space-x-2 bg-secondary text-primary-dark font-bold py-4 hover:bg-secondary-dark transition-colors duration-200">
                                <QrCodeIcon className="w-5 h-5" />
                                <span>Scan to Check In</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StudentDashboard: React.FC = () => {
    const { currentUser, tokens, notifications, checkInStudent, clearNotification } = useAppContext();
    const [scanningToken, setScanningToken] = useState<Token | null>(null);

    const userTokens = useMemo(() => {
        return tokens.filter(t => t.studentId === currentUser?.id);
    }, [currentUser, tokens]);

    const activeTokens = useMemo(() => {
        return userTokens.filter(t => t.status === TokenStatus.WAITING || t.status === TokenStatus.IN_PROGRESS)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [userTokens]);
    
    const userNotifications = notifications.filter(n => n.userId === currentUser?.id);

    const handleScanSuccess = (tokenId: string) => {
        checkInStudent(tokenId);
        setScanningToken(null);
    };

    return (
        <div>
            {scanningToken && (
                <ScannerModal 
                    token={scanningToken}
                    onClose={() => setScanningToken(null)}
                    onScanSuccess={handleScanSuccess}
                />
            )}

            {userNotifications.map(notification => (
                 <div key={notification.id} className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r-lg shadow-sm flex justify-between items-center">
                    <p className="font-semibold">{notification.message}</p>
                    <button onClick={() => clearNotification(notification.id)} className="font-bold text-lg">&times;</button>
                </div>
            ))}
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 whitespace-nowrap">My Dashboard</h1>
                {activeTokens.length > 0 && (
                    <Link to="/book-token" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-light transition-colors duration-200 flex items-center space-x-2 text-sm whitespace-nowrap">
                        <TicketIcon className="w-4 h-4" />
                        <span>Book Token</span>
                    </Link>
                )}
            </div>

            {activeTokens.length > 0 ? (
                <div className="space-y-6">
                    {activeTokens.map(token => <ActiveTokenCard key={token.id} token={token} currentUser={currentUser} onScan={setScanningToken} />)}
                </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-xl shadow-md border border-neutral-200">
                    <TicketIcon className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
                    <h2 className="text-xl font-bold text-neutral-800 mb-2">No Active Tokens</h2>
                    <p className="text-neutral-600 mb-6">You don't have any active tokens right now. Book one to get started!</p>
                    <Link to="/book-token" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-light transition-colors duration-200">
                        Book a Token
                    </Link>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;