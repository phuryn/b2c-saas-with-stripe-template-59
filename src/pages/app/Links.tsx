
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const Links: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`p-6 ${isMobile ? 'pt-16' : ''}`}>
      <h1 className="text-2xl font-semibold mb-6">Links</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Your links will appear here.</p>
      </div>
    </div>
  );
};

export default Links;
