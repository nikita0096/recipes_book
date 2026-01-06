'use client';

import React, {useState} from 'react';
import {IoClose} from "react-icons/io5";
import {FaGoogle} from "react-icons/fa";
import {handleEmailLogin, handleGoogleLogin, handleSignUp} from "@/lib/supabase/authClient";
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


  const handleLoginWithEmail: SubmitHandler<ILoginPageForm> = async (formData) => {
    try {
      const user = await handleEmailLogin(formData.emailLogin, formData.passwordLogin);

      if (user) {
        setUserData({
          name: 'User',
          avatar_url: '',
          role: false,
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

  const handleSignUpWithEmail: SubmitHandler<ILoginPageForm> = async (formData) => {
    try {
      await handleSignUp(formData.emailSignUp, formData.passwordSignUp);

      await handleLoginWithEmail(formData.emailSignUp, formData.passwordSignUp);

    } catch (error) {
      console.error(error);
    } finally {
      resetSignUp();
      resetLogin();
      setIsOpenLoginPage(false);
    }
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
    <div className="absolute top-0 left-0 w-full h-screen flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
      <div className='relative w-2/3 bg-gray-700 flex flex-col items-center justify-around p-5 rounded-xl'>
        <div className='flex items-center justify-around w-1/3 bg-pink-100 text-black p-1 rounded-full'>
          <div onClick={handlePageTab}
               className={authMode === 'login' ? 'bg-gray-700 text-white p-2 rounded-full transition' : 'p-2 rounded-full transition'}>
            Log in
          </div>
          <div onClick={handlePageTab}
               className={authMode === 'signup' ? 'bg-gray-700 text-white p-2 rounded-full transition' : 'p-2 rounded-full transition'}>
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
          <button onClick={handleGoogleLogin}
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