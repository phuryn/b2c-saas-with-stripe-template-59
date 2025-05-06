
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Dashboard: React.FC = () => {
  const { userMetadata } = useAuth();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-medium mb-4">Welcome, {userMetadata?.name || userMetadata?.full_name || 'User'}!</h2>
        <p>This is your application dashboard. Start exploring!</p>
      </div>
    </div>
  );
};

export default Dashboard;
