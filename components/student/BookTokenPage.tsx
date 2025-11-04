
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Priority } from '../../types';

const BookTokenPage: React.FC = () => {
  const { offices, bookToken } = useAppContext();
  const navigate = useNavigate();

  const [officeId, setOfficeId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [error, setError] = useState('');

  const activeOffices = offices.filter(o => o.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeId || !purpose) {
      setError('Please select an office and state your purpose.');
      return;
    }
    setError('');
    bookToken(officeId, purpose, priority);
    // Add a small delay to simulate processing before navigating
    setTimeout(() => navigate('/dashboard'), 500);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Book a New Token</h1>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-neutral-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="office" className="block text-sm font-medium text-neutral-700 mb-1">Select Office</label>
            <select
              id="office"
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary-light focus:border-primary-light bg-white text-neutral-900"
            >
              <option value="" disabled>Choose an office...</option>
              {activeOffices.map(office => (
                <option key={office.id} value={office.id}>{office.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-neutral-700 mb-1">Purpose of Visit</label>
            <input
              type="text"
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., 'Fee Payment', 'Transcript Request'"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary-light focus:border-primary-light bg-white text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
            <div className="flex space-x-4">
              {Object.values(Priority).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${priority === p ? 'bg-primary-dark text-white' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-primary-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-transform duration-200 hover:scale-105"
            >
              Get Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookTokenPage;