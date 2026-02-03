'use client';
import React from 'react';
import {SubmitHandler, UseFormHandleSubmit, UseFormRegister} from "react-hook-form";
import {ISignUpValues} from "@/components/authorization/AuthPage";

interface SignUpPageProps {
  registerSignUp: UseFormRegister<ISignUpValues>
  handleSubmitSignUp: UseFormHandleSubmit<ISignUpValues>
  handleSignUpWithEmail: SubmitHandler<ISignUpValues>
}

const SignUpPage: React.FC<SignUpPageProps> = ({registerSignUp, handleSubmitSignUp, handleSignUpWithEmail}) => {
  return (
    <div className='w-full'>
      <form className='flex flex-col items-center w-full'
            onSubmit={handleSubmitSignUp(handleSignUpWithEmail)}>
        <label className='w-full mb-4'>
          <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Email</span>
          <input
            {...registerSignUp('emailSignUp')}
            className='w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors'
            type="email"
            placeholder="your@email.com"
          />
        </label>
        <label className='w-full mb-6'>
          <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Password</span>
          <input
            {...registerSignUp('passwordSignUp')}
            className='w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors'
            type="password"
            placeholder="Create a password"
          />
        </label>
        <button
          type='submit'
          className='w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg'
        >
          Sign up
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;