
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const ProfileSettings: React.FC = () => {
  const { user, userMetadata, profile, authProvider, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate initials from display name or email
  const getInitials = () => {
    const name = profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0] || 'U';
    return name.substring(0, 2).toUpperCase();
  };
  
  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    await updateProfile({ display_name: displayName });
    setIsSubmitting(false);
    setIsEditing(false);
  };
  
  return (
    <div>
      <h2 className="text-xl font-medium mb-6">Profile Settings</h2>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
                <AvatarFallback>
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Display Name</h3>
                {isEditing && authProvider === 'email' ? (
                  <div className="space-y-2">
                    <Input 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0]}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-1">Email</Label>
                <p className="p-2 border rounded-md bg-gray-50">{user?.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-1">Authentication Method</Label>
                <p className="p-2 border rounded-md bg-gray-50 capitalize">{authProvider || 'Email'}</p>
              </div>
            </div>
          </CardContent>
          
          {authProvider === 'email' && (
            <CardFooter className="flex justify-end space-x-2 pt-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(profile?.display_name || '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
