import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MOCK_USERS } from '../../constants';
import { User, Role } from '../../types';
import { EyeIcon, EyeOffIcon, CheckCircleIcon, CloseIcon } from '../common/Icons';
import * as authApi from '../../src/api/auth';

const InputField: React.FC<{ id: string, type: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, readOnly?: boolean, maxLength?: number, disabled?: boolean }> = 
({ id, type, placeholder, value, onChange, readOnly = false, maxLength, disabled = false }) => (
    <div>
        <label htmlFor={id} className="sr-only">{placeholder}</label>
        <input
            id={id}
            name={id}
            type={type}
            required
            className={`w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-primary-light focus:border-primary-light bg-white text-neutral-900 ${readOnly ? 'bg-neutral-100 cursor-not-allowed' : ''} ${disabled ? 'bg-neutral-100 opacity-70' : ''}`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            maxLength={maxLength}
            disabled={disabled}
        />
    </div>
);

const PasswordField: React.FC<{
    id: string,
    placeholder: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onFocus?: () => void,
    onBlur?: () => void,
}> = ({ id, placeholder, value, onChange, onFocus, onBlur }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative">
            <label htmlFor={id} className="sr-only">{placeholder}</label>
            <input
                id={id}
                name={id}
                type={isVisible ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-primary-light focus:border-primary-light bg-white text-neutral-900"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-500 hover:text-primary-dark"
                aria-label={isVisible ? "Hide password" : "Show password"}
            >
                {isVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>
    );
};

const PasswordCriteria: React.FC<{ criteria: { name: string, met: boolean }[] }> = ({ criteria }) => (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {criteria.map(c => (
             <li key={c.name} className={`flex items-center transition-colors ${c.met ? 'text-green-600' : 'text-neutral-500'}`}>
                <CheckCircleIcon className={`w-4 h-4 mr-1.5 ${c.met ? 'stroke-current' : 'stroke-neutral-400'}`} />
                <span>{c.name}</span>
            </li>
        ))}
    </ul>
);

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { requestPasswordReset } = useAppContext();
    const [resetEmail, setResetEmail] = useState('');
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (resetEmail) {
            requestPasswordReset(resetEmail);
            setIsSent(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-800">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-neutral-800 mb-4 text-center">Reset Password</h2>
                {isSent ? (
                    <div className="text-center">
                        <p className="text-neutral-600 my-6">If an account with that email exists, a password reset link has been sent.</p>
                        <button onClick={onClose} className="w-full bg-neutral-200 text-neutral-800 font-bold py-3 px-6 rounded-lg hover:bg-neutral-300 transition-all">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-neutral-600 text-sm text-center">Enter your email address and we'll send you a link to reset your password.</p>
                        <InputField id="resetEmail" type="email" placeholder="Email Address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                        <button type="submit" className="w-full bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light transition-transform duration-200 hover:scale-105">Send Reset Link</button>
                    </form>
                )}
            </div>
        </div>
    );
};

const StudentAuthPage: React.FC = () => {
    const { login: loginDemoUser, setAuthenticatedUser } = useAppContext();
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    
    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Signup State
    const [signupStep, setSignupStep] = useState(1);
    const [signupEmail, setSignupEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [signupError, setSignupError] = useState('');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const passwordCriteria = useMemo(() => ([
        { name: '1 Uppercase', met: /[A-Z]/.test(signupPassword) },
        { name: '1 Number', met: /[0-9]/.test(signupPassword) },
        { name: '1 Special (!@#..)', met: /[!@#$%^&*]/.test(signupPassword) },
        { name: '8+ Characters', met: signupPassword.length >= 8 },
    ]), [signupPassword]);
    
    const allPasswordCriteriaMet = useMemo(() => passwordCriteria.every(c => c.met), [passwordCriteria]);
    const passwordsMatch = useMemo(() => signupPassword && signupConfirmPassword && signupPassword === signupConfirmPassword, [signupPassword, signupConfirmPassword]);

    const mapRoleFromServer = (role?: string): Role => {
        const upper = (role || '').toUpperCase();
        if (upper === 'ADMIN') return Role.ADMIN;
        if (upper === 'STAFF' || upper === 'TEACHER') return Role.STAFF;
        return Role.STUDENT;
    };

    const persistAuthState = (token: string, userPayload: any) => {
        if (!token || !userPayload) return;
        const normalizedUser = {
            id: userPayload.id,
            name: userPayload.name,
            email: userPayload.email,
            role: mapRoleFromServer(userPayload.role),
            assignedOfficeIds: userPayload.assignedOfficeIds,
        };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setAuthenticatedUser({
            id: normalizedUser.id,
            name: normalizedUser.name,
            email: normalizedUser.email,
            role: userPayload.role,
            assignedOfficeIds: normalizedUser.assignedOfficeIds,
        });
    };

    const handleFinalizeRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authApi.completeRegistration(signupEmail);
            // backend returns token and user
            if (res && res.token) {
                persistAuthState(res.token, res.user);
                setSuccessMessage('Registration complete! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/'; // or use router
                }, 1500);
            }
        } catch (err: any) {
            setSignupError(err?.data?.error || 'Failed to complete registration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            const res = await authApi.login(loginEmail, loginPassword);
            if (res && res.token) {
                persistAuthState(res.token, res.user);
                window.location.href = '/';
            } else {
                setLoginError('Invalid response from server');
            }
        } catch (err: any) {
            setLoginError(err?.data?.error || 'Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendVerificationCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignupError('');
        setSuccessMessage('');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signupEmail)) {
            setSignupError('Please enter a valid email address.');
            return;
        }
        const allowedDomains = ['kluniversity.in', 'gmail.com'];
        const domain = signupEmail.split('@')[1];
        if (!allowedDomains.includes(domain)) {
            setSignupError('Please use a valid university or Gmail account.');
            return;
        }

        // Just validate email format and move to step 2 to collect name/password
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSuccessMessage(`Email validated. Please provide your details.`);
            setTimeout(() => {
                 setSignupStep(2);
                 setSuccessMessage('');
            }, 800);
        }, 500);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignupError('');
        // Call backend verifyCode API
        if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
            setIsLoading(true);
            try {
                await authApi.verifyCode(signupEmail, verificationCode);
                setSuccessMessage('Code verified successfully!');
                setTimeout(() => {
                    setSignupStep(4); // move to final step (or complete registration)
                    setSuccessMessage('');
                }, 1000);
            } catch (err: any) {
                setSignupError(err?.data?.error || 'Invalid or expired code');
            } finally {
                setIsLoading(false);
            }
        } else {
            setSignupError('Please enter a valid 6-digit verification code.');
        }
    };
    
    const handleCompleteRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignupError('');

        if (signupName.length < 2 || signupName.length > 50) {
            setSignupError('Name must be between 2 and 50 characters.');
            return;
        }
        if (!allPasswordCriteriaMet) {
            setSignupError('Password does not meet all criteria.');
            return;
        }
        if (!passwordsMatch) {
            setSignupError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            // Step 2: now we have name, email, password — send verification code
            console.log('→ Calling backend API: sendVerificationCode', { name: signupName, email: signupEmail });
            const response = await authApi.sendVerificationCode(signupName, signupEmail, signupPassword);
            console.log('✓ Verification code sent successfully:', response);
            setSuccessMessage(`Verification code sent to ${signupEmail}`);
            setTimeout(() => {
                setSignupStep(3); // move to verification step
                setSuccessMessage('');
            }, 1500);
        } catch (err: any) {
            console.error('✗ Failed to send verification code:', err);
            const errorMsg = err?.data?.error || err?.message || err?.data?.message || 'Failed to send verification code. Check console for details.';
            console.error('Error details:', { status: err?.status, data: err?.data, message: err?.message });
            setSignupError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = (user: User) => {
        if (user.password) {
            setActiveTab('login');
            setLoginEmail(user.email);
            setLoginPassword(user.password);
            loginDemoUser(user.email, user.password);
        }
    };

    const studentUser = MOCK_USERS.find(u => u.role === Role.STUDENT)!;
    const staffUser = MOCK_USERS.find(u => u.role === Role.STAFF)!;
    const adminUser = MOCK_USERS.find(u => u.role === Role.ADMIN)!;

    const renderSignupForm = () => {
        switch(signupStep) {
            case 1:
                return (
                    <form className="space-y-4" onSubmit={handleSendVerificationCode}>
                        <InputField id="signupEmail" type="email" placeholder="Email Address (@kluniversity.in or @gmail.com)" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} disabled={isLoading} />
                        <button type="submit" disabled={isLoading} className="w-full bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light transition-transform duration-200 hover:scale-105 disabled:bg-primary-light/70 disabled:cursor-wait">
                            {isLoading ? 'Validating...' : 'Next'}
                        </button>
                    </form>
                );
            case 2:
                return (
                    <form className="space-y-4" onSubmit={handleCompleteRegistration}>
                        <p className="text-sm text-neutral-600 text-center">Email: <span className="font-semibold">{signupEmail}</span></p>
                        <InputField id="signupName" type="text" placeholder="Full Name" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                        <div className="space-y-2">
                           <PasswordField
                                id="signupPassword"
                                placeholder="Password"
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                           />
                           {signupPassword && isPasswordFocused && <PasswordCriteria criteria={passwordCriteria} />}
                        </div>
                        <div className="space-y-1">
                            <PasswordField id="confirmPassword" placeholder="Confirm Password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} />
                            {signupConfirmPassword && (
                                <p className={`text-xs text-center ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                                    {passwordsMatch ? 'Passwords match!' : 'Passwords do not match.'}
                                </p>
                            )}
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light transition-transform duration-200 hover:scale-105 disabled:bg-primary-light/70">
                            {isLoading ? 'Sending code...' : 'Send Verification Code'}
                        </button>
                        <button type="button" onClick={() => setSignupStep(1)} className="w-full text-center text-sm font-medium text-primary-dark hover:underline">Change Email</button>
                    </form>
                );
            case 3:
                return (
                    <form className="space-y-4" onSubmit={handleVerifyCode}>
                        <p className="text-sm text-center text-neutral-600">Enter the 6-digit code sent to <span className="font-semibold">{signupEmail}</span>.</p>
                        <InputField id="verificationCode" type="text" placeholder="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} maxLength={6} disabled={isLoading} />
                        <button type="submit" disabled={isLoading} className="w-full bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light transition-transform duration-200 hover:scale-105 disabled:bg-primary-light/70">
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button type="button" onClick={() => setSignupStep(2)} className="w-full text-center text-sm font-medium text-primary-dark hover:underline">Go Back</button>
                    </form>
                );
            case 4:
                return (
                    <form className="space-y-4" onSubmit={handleFinalizeRegistration}>
                        <p className="text-center text-green-600 font-semibold">Email verified!</p>
                        <p className="text-sm text-center text-neutral-600">Click below to complete your registration.</p>
                        <button type="submit" disabled={isLoading} className="w-full bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light transition-transform duration-200 hover:scale-105 disabled:bg-primary-light/70">
                            {isLoading ? 'Completing...' : 'Complete Registration'}
                        </button>
                    </form>
                );
            default: return null;
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-light to-primary-dark flex flex-col items-center justify-center p-4 font-sans">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-white tracking-tight">KL SmartQ</h1>
                <p className="text-lg text-blue-100 mt-2">The modern way to manage queues at KL University.</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex border-b border-neutral-200 mb-6">
                    <button onClick={() => setActiveTab('login')} className={`w-1/2 py-3 font-semibold text-center transition-colors ${activeTab === 'login' ? 'text-primary-dark border-b-2 border-primary-dark' : 'text-neutral-500 hover:text-neutral-700'}`}>Login</button>
                    <button onClick={() => setActiveTab('signup')} className={`w-1/2 py-3 font-semibold text-center transition-colors ${activeTab === 'signup' ? 'text-primary-dark border-b-2 border-primary-dark' : 'text-neutral-500 hover:text-neutral-700'}`}>Sign Up</button>
                </div>
                
                {activeTab === 'login' ? (
                    <form className="space-y-4" onSubmit={handleLoginSubmit}>
                        <InputField id="loginEmail" type="email" placeholder="Email Address" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                        <div>
                            <PasswordField id="loginPassword" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                            <div className="text-right mt-2">
                                <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-sm font-medium text-primary-dark hover:underline focus:outline-none">
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                        {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                        <button type="submit" className="w-full bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light transition-transform duration-200 hover:scale-105">Login</button>
                    </form>
                ) : (
                    <>
                        {renderSignupForm()}
                        {signupError && <p className="text-red-500 text-sm text-center mt-4">{signupError}</p>}
                        {successMessage && <p className="text-green-600 text-sm text-center mt-4">{successMessage}</p>}
                    </>
                )}
            </div>
            
            <div className="w-full max-w-4xl mt-10">
                <h3 className="text-center text-lg font-semibold text-blue-100 mb-4">Demo Credentials (Tap to Login)</h3>
                <div className="grid md:grid-cols-3 gap-6 text-left">
                    {[studentUser, staffUser, adminUser].map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleDemoLogin(user)}
                          className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-left hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                           <p className="font-bold text-white text-lg">{user.role}</p>
                           <p className="text-blue-200 text-sm">Email: <span className="font-mono">{user.email}</span></p>
                           <p className="text-blue-200 text-sm">Password: <span className="font-mono">{user.password}</span></p>
                        </button>
                    ))}
                </div>
            </div>

            <footer className="text-center mt-10 text-blue-200 text-sm">
                <p>&copy; {new Date().getFullYear()} KL University. All rights reserved.</p>
            </footer>

            {isForgotPasswordOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordOpen(false)} />}
        </div>
    );
};

export default StudentAuthPage;
