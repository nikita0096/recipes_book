import React from 'react';

const LoadingPage = () => {
  return (
    <div className='w-full h-screen flex justify-center items-center'>
      <div className="loader">
        <div className="cup">
          <div className="cup-handle"></div>
          <div className="smoke one"></div>
          <div className="smoke two"></div>
          <div className="smoke three"></div>
        </div>
        <div className="load">..........................</div>
      </div>
    </div>
  );
};

export default LoadingPage;