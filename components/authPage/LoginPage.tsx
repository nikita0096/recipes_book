'use client';

import React, {useState} from 'react';
import {IoClose} from "react-icons/io5";
import {FaGoogle} from "react-icons/fa";
import {handleEmailLogin, handleGoogleLogin} from "@/supabase/authClient";
import {SubmitHandler, useForm} from "react-hook-form";
import {useUserStore} from "@/store/useUserStore";

interface ILoginPageProps {
  setIsOpenLoginPage: (value: boolean) => void;
}

interface ILoginPageForm {
  email: string;
  password: string;
}

const LoginPage: React.FC<ILoginPageProps> = ({setIsOpenLoginPage}) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const {setUserData} = useUserStore();

  const {register, handleSubmit, reset} = useForm<ILoginPageForm>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleLoginWithEmail: SubmitHandler<ILoginPageForm> = async (formData) => {
    try {
      const data= await handleEmailLogin(formData.email, formData.password);
      setUserData({
        name: 'User',
        avatar_url: '',
        role: false,
      })
    } catch (err) {
      console.error(err);
    } finally {
      reset();
      setIsOpenLoginPage(false);
    }
  }

  return (
    <div className="absolute top-0 left-0 w-full h-screen flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
      <div className='relative w-2/3 bg-gray-700 flex flex-col items-center justify-around p-5 rounded-xl'>
        <div className='flex items-center justify-around w-1/3 bg-pink-100 text-black p-1 rounded-full'>
          <div onClick={() => setIsLogin(true)}
               className={isLogin ? 'bg-gray-700 text-white p-2 rounded-full transition' : 'p-2 rounded-full transition'}>
            Log in
          </div>
          <div onClick={() => setIsLogin(false)}
               className={!isLogin ? 'bg-gray-700 text-white p-2 rounded-full transition' : 'p-2 rounded-full transition'}>
            Sign up
          </div>
        </div>

        {isLogin
          ? <div className='w-full'>
            <form className='flex flex-col items-center justify-centermt-3 w-full'
                  onSubmit={handleSubmit(handleLoginWithEmail)}>
              <label className='w-2/3 mt-3'>Email
                <input {...register('email')} className='block border-2 rounded-xl p-2 w-full'
                       type="email"/>
              </label>
              <label className='w-2/3 mt-3'>Password
                <input {...register('password')} className='block border-2 rounded-xl p-2 w-full'
                       type="password"/>
              </label>
              <button type='submit'
                      className='py-2 px-4 mt-3 border rounded-xl'>Login
              </button>
            </form>
            <div className='flex flex-col items-center justify-center w-full'>
              <button onClick={handleGoogleLogin}
                      className='flex items-center justify-center gap-2 py-2 px-4 border rounded-xl mt-3'>
                <FaGoogle/>
                Войти через Google
              </button>
            </div>
          </div>
          : <div className='w-full'>
            <form className='flex flex-col items-center justify-centermt-3 w-full'
                  action="">
              <label className='w-2/3 mt-3'>Email
                <input className='block border-2 rounded-xl p-2 w-full'
                       type="email"/>
              </label>
              <label className='w-2/3 mt-3'>Password
                <input className='block border-2 rounded-xl p-2 w-full'
                       type="password"/>
              </label>
              <label className='w-2/3 mt-3'>Confirm Password
                <input className='block border-2 rounded-xl p-2 w-full'
                       type="password"/>
              </label>
            </form>
            <div className='flex flex-col items-center justify-center mt-5 w-full'>
              <button className='py-2 px-4  border rounded-xl'>Sign up</button>
            </div>
          </div>}
        <IoClose className='absolute top-5 right-5 text-4xl'
                 onClick={() => setIsOpenLoginPage(false)}/>
      </div>
    </div>
  );
};

export default LoginPage;