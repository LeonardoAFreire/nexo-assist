import { type SubmitEvent, useState } from 'react';
import { loginErrorMessage } from './login-error-message.js';
import { useLogin } from './use-login.js';

export type LoginFormState = {
  email: string;
  password: string;
  remember: boolean;
  isPending: boolean;
  errorMessage: string | undefined;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRemember: (value: boolean) => void;
  submit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function useLoginForm(): LoginFormState {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const { mutate, isPending, error } = useLogin();
  const errorMessage = error ? loginErrorMessage(error) : undefined;

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    mutate({ email, password, remember });
  }

  return {
    email,
    password,
    remember,
    isPending,
    errorMessage,
    setEmail,
    setPassword,
    setRemember,
    submit,
  };
}
