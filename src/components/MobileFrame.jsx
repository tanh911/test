import React from 'react';

export const MobileFrame = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-transparent flex flex-col font-sans antialiased text-[#111827]">
      {children}
    </div>
  );
};
