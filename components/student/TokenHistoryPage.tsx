
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Token, TokenStatus } from '../../types';

const getStatusBadge = (status: TokenStatus) => {
  switch (status) {
    case TokenStatus.WAITING: return 'bg-yellow-100 text-yellow-800';
    case TokenStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
    case TokenStatus.COMPLETED: return 'bg-green-100 text-green-800';
    case TokenStatus.CANCELLED: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TokenHistoryCard: React.FC<{ token: Token }> = ({ token }) => {
    const { offices } = useAppContext();
    const office = offices.find(o => o.id === token.officeId);

    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-neutral-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
                <p className="font-bold text-lg text-primary-dark">{token.tokenNumber}</p>
                <p className="text-sm text-neutral-600">{office?.name || 'Unknown Office'}</p>
            </div>
            <div className="text-neutral-700">
                <p className="font-medium">{token.purpose}</p>
            </div>
            <div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(token.status)}`}>
                    {token.status}
                </span>
            </div>
            <div className="text-sm text-neutral-500 text-right">
                <p>{new Date(token.createdAt).toLocaleDateString()}</p>
                <p>{new Date(token.createdAt).toLocaleTimeString()}</p>
            </div>
        </div>
    );
}

const TokenHistoryPage: React.FC = () => {
  const { currentUser, tokens } = useAppContext();

  const userTokens = useMemo(() => {
    return tokens
      .filter(t => t.studentId === currentUser?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentUser, tokens]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">My Token History</h1>
      {userTokens.length > 0 ? (
        <div className="space-y-4">
          {userTokens.map(token => <TokenHistoryCard key={token.id} token={token} />)}
        </div>
      ) : (
        <div className="text-center bg-white p-10 rounded-lg shadow-sm">
            <p className="text-neutral-600">You have no token history yet.</p>
        </div>
      )}
    </div>
  );
};

export default TokenHistoryPage;
