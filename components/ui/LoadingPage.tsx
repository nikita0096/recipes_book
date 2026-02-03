import React from 'react';

const LoadingPage = () => {
  return (
    <div className='fixed inset-0 flex justify-center items-center -z-10'>
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