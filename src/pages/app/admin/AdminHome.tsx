
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import AdminStripeConfig from './AdminStripeConfig';

const AdminHome: React.FC = () => {
  const { userRole } = useAuth();
  
  if (userRole !== 'administrator') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Only administrators can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Stripe Administration</h1>
      
      <AdminStripeConfig />
    </div>
  );
};

export default AdminHome;
