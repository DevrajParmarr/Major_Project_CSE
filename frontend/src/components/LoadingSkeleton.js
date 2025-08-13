import React from 'react';

const SkeletonLine = ({ width = '100%' }) => (
  <div style={{ width, height: 12, background: 'linear-gradient(90deg, #f0f2f5, #f7f9fb, #f0f2f5)', backgroundSize: '200% 100%', animation: 'loading 1.2s infinite', borderRadius: 6 }} />
);

const LoadingSkeleton = ({ lines = 3 }) => {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: lines }).map((_, idx) => (
          <SkeletonLine key={idx} width={`${80 + Math.round(Math.random() * 20)}%`} />
        ))}
      </div>
      <style>{`
        @keyframes loading { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;