import React from 'react';

const BackgroundElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-400/15 to-purple-500/15 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary-400/10 to-pink-400/10 rounded-full blur-3xl animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-purple-400/8 to-primary-400/8 rounded-full blur-3xl animate-pulse-slow"></div>
      
      {/* Floating sparkles */}
      <div className="absolute top-20 left-1/4 w-2 h-2 bg-brand rounded-full opacity-60 animate-twinkle"></div>
      <div className="absolute top-40 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-40 animate-twinkle-delayed"></div>
      <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-primary-400 rounded-full opacity-50 animate-twinkle"></div>
    </div>
  );
};

export default BackgroundElements;