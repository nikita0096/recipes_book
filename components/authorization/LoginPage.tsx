'use client';

import React from 'react';

const LoginPage = ({registerLogin, handleSubmitLogin, handleLoginWithEmail}) => {
  return (
    <div className='w-full'>
      <form className='flex flex-col items-center justify-center mt-3 w-full'
            onSubmit={handleSubmitLogin(handleLoginWithEmail)}>
        <label className='w-2/3 mt-3'>Email
          <input {...registerLogin('emailLogin')} className='block border-2 rounded-xl p-2 w-full'
                 type="email"/>
        </label>
        <label className='w-2/3 mt-3'>Password
          <input {...registerLogin('passwordLogin')} className='block border-2 rounded-xl p-2 w-full'
                 type="password"/>
        </label>
        <button type='submit'
                className='py-2 px-4 mt-3 border rounded-xl'>Log in
        </button>
      </form>
    </div>
  );
};

export default LoginPage;