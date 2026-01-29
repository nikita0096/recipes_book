'use client';

import React, {useState} from 'react';
import {IoClose} from "react-icons/io5";
import {FaGoogle} from "react-icons/fa";
import {handleEmailLogin, handleGoogleLogin, handleSignUp, getUserProfile} from "@/lib/supabase/authClient";
import {SubmitHandler, useForm} from "react-hook-form";
import {useUserStore} from "@/store/useUserStore";
import LoginPage from "@/components/authorization/LoginPage";
import SignUpPage from "@/components/authorization/SignUpPage";

interface ILoginPageProps {
  setIsOpenLoginPage: (value: boolean) => void;
}

interface ILoginValues {
  emailLogin: string;
  passwordLogin: string;
}

interface ISignUpValues {
  emailSignUp: string;
  passwordSignUp: string;
}

const AuthPage: React.FC<ILoginPageProps> = ({setIsOpenLoginPage}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const {setUserData} = useUserStore();

  const loginFrom = useForm<ILoginValues>({
    defaultValues: {
      emailLogin: '',
      passwordLogin: ''
    }
  });

  const signUpForm = useForm<ISignUpValues>({
    defaultValues: {
      emailSignUp: '',
      passwordSignUp: ''
    }
  })

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    reset: resetLogin
  } = loginFrom;

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    reset: resetSignUp
  } = signUpForm;


  const handleLoginWithEmail: SubmitHandler<ILoginValues> = async (formData) => {
    try {
      const data = await handleEmailLogin(formData.emailLogin, formData.passwordLogin);
      console.log(data);
      if (data?.user) {
        const profile = await getUserProfile(data.user.id);

        setUserData({
          name: data.user.user_metadata?.name || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role: profile?.role || 'user',
        })
      }

    } catch (err) {
      console.error(err);
    } finally {
      resetSignUp();
      resetLogin();
      setIsOpenLoginPage(false);
    }
  }

  const handleSignUpWithEmail: SubmitHandler<ISignUpValues> = async (formData) => {
    try {
      await handleSignUp(formData.emailSignUp, formData.passwordSignUp);

      const data = await handleEmailLogin(formData.emailSignUp, formData.passwordSignUp);

      if (data?.user) {
        // const profile = await getUserProfile(data.user.id);

        setUserData({
          name: data.user.user_metadata?.name || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role: 'user',
        });
      }

    } catch (error) {
      console.error(error);
    } finally {
      resetSignUp();
      resetLogin();
      setIsOpenLoginPage(false);
    }
  }

  const handleLoginWithGoogle = async () => {
    const data = await handleGoogleLogin();

    console.log(data);
  }

  const handlePageTab = () => {
    if(authMode === 'login') {
      setAuthMode('signup');
      resetLogin();
    } else {
      setAuthMode('login');
      resetSignUp();
    }
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
      <div className='relative w-2/3 max-w-lg min-h-[400px] bg-pink-100 dark:bg-gray-700 flex flex-col items-center justify-around p-5 rounded-xl'>
        <div className='flex items-center justify-around w-1/3 bg-pink-100 text-black p-1 rounded-full'>
          <div onClick={handlePageTab}
               className={authMode === 'login' ? 'bg-gray-700 text-white p-2 rounded-full transition cursor-pointer' : 'p-2 rounded-full transition cursor-pointer'}>
            Log in
          </div>
          <div onClick={handlePageTab}
               className={authMode === 'signup' ? 'bg-gray-700 text-white p-2 rounded-full transition cursor-pointer' : 'p-2 rounded-full transition cursor-pointer'}>
            Sign up
          </div>
        </div>

        {authMode === 'login'
          ? <LoginPage registerLogin={registerLogin}
                       handleSubmitLogin={handleSubmitLogin}
                       handleLoginWithEmail={handleLoginWithEmail}/>
          : <SignUpPage registerSignUp={registerSignUp}
                        handleSubmitSignUp={handleSubmitSignUp}
                        handleSignUpWithEmail={handleSignUpWithEmail}/>}
        <div className='flex flex-col items-center justify-center w-full'>
          <button onClick={handleLoginWithGoogle}
                  className='flex items-center justify-center gap-2 py-2 px-4 border rounded-xl mt-3'>
            <FaGoogle/>
            Log in with Google
          </button>
        </div>
        <IoClose className='absolute top-5 right-5 text-4xl'
                 onClick={() => setIsOpenLoginPage(false)}/>
      </div>

    </div>
  );
};

export default AuthPage;