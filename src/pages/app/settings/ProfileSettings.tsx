
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfileSettings: React.FC = () => {
  const { user, userMetadata } = useAuth();
  
  return (
    <div>
      <h2 className="text-xl font-medium mb-6">Profile Settings</h2>
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={userMetadata?.avatar_url} alt={userMetadata?.name || user?.email?.split('@')[0] || 'User'} />
            <AvatarFallback>
              {(userMetadata?.name || user?.email?.split('@')[0] || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-gray-500">Profile Photo</p>
            <p className="text-sm">From Google Account</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Display Name</h3>
            <p className="p-2 border rounded-md bg-gray-50">{userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0]}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
            <p className="p-2 border rounded-md bg-gray-50">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
