'use client';
import React from 'react';

const SignUpPage = ({registerSignUp, handleSubmitSignUp, handleSignUpWithEmail}) => {
  return (
    <div className='w-full'>
      <form className='flex flex-col items-center justify-center mt-3 w-full'
            onSubmit={handleSubmitSignUp(handleSignUpWithEmail)}>
        <label className='w-2/3 mt-3'>Email
          <input {...registerSignUp('emailSignUp')}
                 className='block border-2 rounded-xl p-2 w-full'
                 type="email"/>
        </label>
        <label className='w-2/3 mt-3'>Password
          <input {...registerSignUp('passwordSignUp')} className='block border-2 rounded-xl p-2 w-full'
                 type="password"/>
        </label>
        <button type='submit'
                className='py-2 px-4 mt-3 border rounded-xl'>Sign up
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;