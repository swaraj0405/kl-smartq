import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Office } from '../../types';
import { EyeIcon, DownloadIcon, EditIcon, TrashIcon } from '../common/Icons';

const OfficeForm: React.FC<{ office?: Office; onSave: (office: Omit<Office, 'id'> | Office) => void; onCancel: () => void }> = ({ office, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: office?.name || '',
        operatingHours: office?.operatingHours || '',
        tokenLimit: office?.tokenLimit || 100,
        prefix: office?.prefix || '',
        isActive: office?.isActive !== undefined ? office.isActive : true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({...prev, [name]: checked }));
        } else {
             setFormData(prev => ({...prev, [name]: name === 'tokenLimit' ? parseInt(value) : value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(office ? {...office, ...formData} : formData);
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                 <h2 className="text-2xl font-bold mb-6 text-neutral-800">{office ? 'Edit Office' : 'Add Office'}</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Office Name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded bg-white text-neutral-900" required />
                    <input type="text" name="prefix" placeholder="Token Prefix (e.g., REG)" value={formData.prefix} onChange={handleChange} className="w-full p-2 border rounded bg-white text-neutral-900" required />
                    <input type="text" name="operatingHours" placeholder="Operating Hours" value={formData.operatingHours} onChange={handleChange} className="w-full p-2 border rounded bg-white text-neutral-900" required />
                    <input type="number" name="tokenLimit" placeholder="Token Limit" value={formData.tokenLimit} onChange={handleChange} className="w-full p-2 border rounded bg-white text-neutral-900" required />
                    <label className="flex items-center space-x-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> <span className="text-neutral-700">Active</span></label>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-neutral-200 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Save</button>
                    </div>
                 </form>
            </div>
        </div>
    )
};

const QrCodeModal: React.FC<{ office: Office; onClose: () => void }> = ({ office, onClose }) => {
    const qrCodeData = JSON.stringify({ type: 'office-checkin', officeId: office.id });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=250x250&bgcolor=ffffff`;

    const handleDownload = () => {
        fetch(qrCodeUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `qrcode-${office.prefix.toLowerCase()}-${office.id}.png`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            })
            .catch(() => alert('Failed to download QR code.'));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-2 text-neutral-800">{office.name}</h2>
                <p className="text-neutral-600 mb-6">Check-in QR Code</p>
                <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
                    <img src={qrCodeUrl} alt={`QR Code for ${office.name}`} width="250" height="250" />
                </div>
                <div className="flex justify-center space-x-4 mt-6">
                    <button onClick={handleDownload} className="px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light">Download</button>
                    <button onClick={onClose} className="px-5 py-2 bg-neutral-200 rounded-lg">Close</button>
                </div>
            </div>
        </div>
    );
};

const OfficeManagementPage: React.FC = () => {
  const { offices, addOffice, updateOffice, deleteOffice } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | undefined>(undefined);
  const [viewingQrOffice, setViewingQrOffice] = useState<Office | null>(null);

  const handleSave = (officeData: Omit<Office, 'id'> | Office) => {
    if ('id' in officeData) {
      updateOffice(officeData);
    } else {
      addOffice(officeData);
    }
    setIsModalOpen(false);
    setEditingOffice(undefined);
  };
  
  const openEditModal = (office: Office) => {
    setEditingOffice(office);
    setIsModalOpen(true);
  };
  
  const handleDownloadQr = (office: Office) => {
        const qrCodeData = JSON.stringify({ type: 'office-checkin', officeId: office.id });
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=300x300&bgcolor=ffffff`;
        fetch(qrCodeUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `qrcode-${office.prefix.toLowerCase()}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">Office Management</h1>
        <button onClick={() => { setEditingOffice(undefined); setIsModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light">Add Office</button>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {offices.map(office => (
            <div key={office.id} className="bg-white rounded-lg shadow-md border border-neutral-200 p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg text-neutral-800">{office.name} ({office.prefix})</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block mt-1 ${office.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {office.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <button onClick={() => openEditModal(office)} className="text-neutral-500 hover:text-blue-600 transition-colors" title="Edit Office">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteOffice(office.id)} className="text-neutral-500 hover:text-red-600 transition-colors" title="Delete Office">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                    <p className="text-sm text-neutral-600"><strong>Token Limit:</strong> {office.tokenLimit}</p>
                    <div className="flex items-center space-x-4">
                        <strong className="text-sm text-neutral-600">QR Code:</strong>
                        <button onClick={() => setViewingQrOffice(office)} className="text-primary-dark hover:text-primary-light transition-colors flex items-center text-sm font-semibold" title="View QR Code">
                            <EyeIcon className="w-4 h-4 mr-1" /> View
                        </button>
                        <button onClick={() => handleDownloadQr(office)} className="text-primary-dark hover:text-primary-light transition-colors flex items-center text-sm font-semibold" title="Download QR Code">
                            <DownloadIcon className="w-4 h-4 mr-1" /> Download
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>


      {/* Desktop Table View */}
      <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden hidden md:block">
        <table className="w-full">
          <thead className="bg-neutral-100">
            <tr>
              <th className="p-4 text-left text-sm font-medium text-neutral-600 uppercase tracking-wider">Name</th>
              <th className="p-4 text-left text-sm font-medium text-neutral-600 uppercase tracking-wider">Status</th>
              <th className="p-4 text-left text-sm font-medium text-neutral-600 uppercase tracking-wider">Token Limit</th>
              <th className="p-4 text-left text-sm font-medium text-neutral-600 uppercase tracking-wider">QR Code</th>
              <th className="p-4 text-left text-sm font-medium text-neutral-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offices.map(office => (
              <tr key={office.id} className="border-b border-neutral-200">
                <td className="p-4 text-neutral-800">{office.name} ({office.prefix})</td>
                <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${office.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {office.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="p-4 text-neutral-800">{office.tokenLimit}</td>
                 <td className="p-4">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setViewingQrOffice(office)} className="text-neutral-500 hover:text-blue-600 transition-colors" title="View QR Code">
                            <EyeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDownloadQr(office)} className="text-neutral-500 hover:text-accent transition-colors" title="Download QR Code">
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                    </div>
                </td>
                <td className="p-4">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => openEditModal(office)} className="text-neutral-500 hover:text-blue-600 transition-colors" title="Edit Office">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteOffice(office.id)} className="text-neutral-500 hover:text-red-600 transition-colors" title="Delete Office">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {isModalOpen && <OfficeForm office={editingOffice} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
       {viewingQrOffice && <QrCodeModal office={viewingQrOffice} onClose={() => setViewingQrOffice(null)} />}
    </div>
  );
};

export default OfficeManagementPage;