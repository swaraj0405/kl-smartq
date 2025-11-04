import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Office, Token, TokenStatus, Priority } from '../../types';

const ConfirmationModal: React.FC<{
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}> = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
                <h2 id="confirmation-title" className="text-xl font-bold mb-4 text-neutral-800">{title}</h2>
                <div className="text-neutral-600 mb-6">{message}</div>
                <div className="flex justify-center space-x-4">
                    <button onClick={onCancel} className="px-6 py-2 bg-neutral-200 text-neutral-800 font-semibold rounded-lg hover:bg-neutral-300 transition-colors">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-neutral-200">
    <p className="text-sm font-medium text-neutral-500">{title}</p>
    <p className={`text-4xl font-bold ${color}`}>{value}</p>
  </div>
);

const TokenCard: React.FC<{ token: Token; position: number }> = ({ token, position }) => {
    const { users } = useAppContext();
    const student = users.find(u => u.id === token.studentId);
    
    const priorityClasses = {
        [Priority.NORMAL]: 'border-l-gray-400',
        [Priority.URGENT]: 'border-l-red-500',
        [Priority.MEDICAL]: 'border-l-blue-500'
    };

    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm border ${priorityClasses[token.priority]} border-l-4 flex justify-between items-center`}>
            <div className="flex items-center space-x-4">
                <span className="text-xl font-bold text-primary-dark w-8 text-center">{position}</span>
                <div>
                    <p className="font-semibold text-neutral-800">{student?.name || 'Unknown Student'}</p>
                    <p className="text-sm text-neutral-600">{token.purpose}</p>
                </div>
            </div>
            <span className="text-xs font-semibold text-neutral-500">{token.priority}</span>
        </div>
    );
};

const CurrentServiceCard: React.FC<{ token: Token; onComplete: (tokenId: string) => void }> = ({ token, onComplete }) => {
    const { users } = useAppContext();
    const student = users.find(u => u.id === token.studentId);
    return (
        <div className="bg-gradient-to-r from-primary-light to-primary-dark text-white p-6 rounded-xl shadow-lg">
            <p className="font-semibold mb-2">Currently Serving</p>
            <h3 className="text-4xl font-bold mb-1">{token.tokenNumber}</h3>
            <p className="text-lg mb-4">{student?.name || 'Unknown Student'}</p>
            <p className="text-blue-100">{token.purpose}</p>
            <button
                onClick={() => onComplete(token.id)}
                className="mt-4 w-full bg-accent text-white font-bold py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
                Mark as Complete
            </button>
        </div>
    );
}

const StaffDashboard: React.FC = () => {
    const { currentUser, offices, tokens, users, callNextToken, completeToken } = useAppContext();
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const staffOffices = useMemo(() =>
        offices.filter(o => currentUser?.assignedOfficeIds?.includes(o.id) || currentUser?.role === 'Admin'),
        [offices, currentUser]
    );
    
    const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(staffOffices[0]?.id || null);

    const officeTokens = useMemo(() =>
        tokens.filter(t => t.officeId === selectedOfficeId && new Date(t.createdAt).toDateString() === new Date().toDateString()),
        [tokens, selectedOfficeId]
    );

    const waitingTokens = useMemo(() => 
        officeTokens
            .filter(t => t.status === TokenStatus.WAITING)
            .sort((a, b) => {
                if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT) return -1;
                if (b.priority === Priority.URGENT && a.priority !== Priority.URGENT) return 1;
                if (a.priority === Priority.MEDICAL && b.priority !== Priority.MEDICAL) return -1;
                if (b.priority === Priority.MEDICAL && a.priority !== Priority.MEDICAL) return 1;
                return a.createdAt.getTime() - b.createdAt.getTime();
            }),
        [officeTokens]
    );
    
    const inProgressToken = useMemo(() => officeTokens.find(t => t.status === TokenStatus.IN_PROGRESS), [officeTokens]);
    const completedCount = useMemo(() => officeTokens.filter(t => t.status === TokenStatus.COMPLETED).length, [officeTokens]);

    const selectedOffice = offices.find(o => o.id === selectedOfficeId);

    const handleConfirmCallNext = () => {
        if (selectedOfficeId) {
            callNextToken(selectedOfficeId);
        }
        setIsConfirmModalOpen(false);
    };

    if (!selectedOfficeId) {
        return <p className="text-center text-neutral-600">You are not assigned to any active offices.</p>
    }
    
    const nextTokenToCall = waitingTokens.length > 0 ? waitingTokens[0] : null;
    const nextStudent = nextTokenToCall ? users.find(u => u.id === nextTokenToCall.studentId) : null;


    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">Queue Management</h1>
                {staffOffices.length > 1 && (
                    <select
                        value={selectedOfficeId}
                        onChange={e => setSelectedOfficeId(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 shadow-sm focus:ring-primary-light focus:border-primary-light"
                    >
                        {staffOffices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                )}
            </div>
            <h2 className="text-xl font-semibold text-neutral-700 mb-4">{selectedOffice?.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Students Waiting" value={waitingTokens.length} color="text-yellow-500" />
                <StatCard title="Currently Serving" value={inProgressToken ? 1 : 0} color="text-blue-500" />
                <StatCard title="Completed Today" value={completedCount} color="text-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-neutral-200">
                    <h3 className="text-xl font-bold text-neutral-800 mb-4">Waiting List</h3>
                    <div className="space-y-3 h-96 overflow-y-auto pr-2">
                        {waitingTokens.length > 0 ? (
                            waitingTokens.map((token, index) => <TokenCard key={token.id} token={token} position={index + 1} />)
                        ) : (
                            <p className="text-center text-neutral-500 pt-10">No students are currently waiting.</p>
                        )}
                    </div>
                </div>
                <div>
                    {!inProgressToken ? (
                         <div className="bg-white p-6 rounded-xl shadow-md border border-neutral-200 flex flex-col items-center justify-center h-full">
                            <p className="text-neutral-600 mb-4 text-center">No one is currently being served.</p>
                            <button
                                onClick={() => setIsConfirmModalOpen(true)}
                                disabled={waitingTokens.length === 0}
                                className="w-full bg-secondary text-primary-dark font-bold py-3 rounded-lg hover:bg-secondary-dark transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                            >
                                Call Next Student
                            </button>
                         </div>
                    ) : (
                        <CurrentServiceCard token={inProgressToken} onComplete={completeToken} />
                    )}
                </div>
            </div>

            {isConfirmModalOpen && nextTokenToCall && (
                <ConfirmationModal
                    title="Confirm Call"
                    message={
                        <>
                            <p>Are you sure you want to call the next student?</p>
                            <div className="my-4 p-3 bg-neutral-100 rounded-lg">
                                <p className="font-bold text-xl text-primary-dark">{nextTokenToCall.tokenNumber}</p>
                                <p className="text-neutral-700">{nextStudent?.name}</p>
                            </div>
                        </>
                    }
                    onConfirm={handleConfirmCallNext}
                    onCancel={() => setIsConfirmModalOpen(false)}
                    confirmText="Call Student"
                    cancelText="Cancel"
                />
            )}
        </div>
    );
};

export default StaffDashboard;