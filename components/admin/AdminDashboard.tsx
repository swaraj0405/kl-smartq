
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { Token, TokenStatus } from '../../types';

const AdminDashboard: React.FC = () => {
    const { tokens, offices } = useAppContext();

    const tokensPerOffice = useMemo(() => {
        return offices.map(office => ({
            name: office.name,
            tokens: tokens.filter(t => t.officeId === office.id).length,
        }));
    }, [tokens, offices]);
    
    const peakHoursData = useMemo(() => {
        const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
        return hours.map(hour => ({
            name: `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`,
            tokens: tokens.filter(t => new Date(t.createdAt).getHours() === hour).length
        }));
    }, [tokens]);

    const waitTimes = useMemo(() => {
        const completedTokensWithWait = tokens
            .filter(t => t.status === TokenStatus.COMPLETED && t.calledAt)
            .map(t => ({
                officeId: t.officeId,
                waitTime: (new Date(t.calledAt!).getTime() - new Date(t.createdAt).getTime()) / 60000 // in minutes
            }));

        return offices.map(office => {
            const officeWaits = completedTokensWithWait.filter(t => t.officeId === office.id).map(t => t.waitTime);
            const avgWait = officeWaits.length > 0 ? officeWaits.reduce((a, b) => a + b, 0) / officeWaits.length : 0;
            return {
                name: office.name,
                'Avg. Wait (mins)': parseFloat(avgWait.toFixed(1)),
            };
        });
    }, [tokens, offices]);

    const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-white p-6 rounded-xl shadow-md border border-neutral-200">
            <h3 className="text-xl font-bold text-neutral-800 mb-6">{title}</h3>
            <div style={{ width: '100%', height: 300 }}>
                {children}
            </div>
        </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-6">System Analytics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Total Tokens per Office">
                    <ResponsiveContainer>
                        <BarChart data={tokensPerOffice}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="tokens" fill="#0D47A1" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Average Wait Times">
                    <ResponsiveContainer>
                        <BarChart data={waitTimes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Avg. Wait (mins)" fill="#FFC107" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                 <div className="lg:col-span-2">
                    <ChartCard title="Peak Hours">
                        <ResponsiveContainer>
                            <LineChart data={peakHoursData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="tokens" stroke="#4CAF50" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
