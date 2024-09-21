import {SyntheticEvent, useState} from 'react';
import {signIn} from '../libs/auth-service';

type Props = {onAuthenticationSuccess: () => void};

const LoginPage = ({onAuthenticationSuccess}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: SyntheticEvent) => {
    e.preventDefault();
    const isSignedIn = await signIn(email, password);
    if (isSignedIn) {
      onAuthenticationSuccess();
    }
  };

  return (
    <form onSubmit={handleSignIn} className="flex flex-col">
      <input
        className="w-80 mt-2"
        id="email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        className="w-80 mt-2"
        id="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button className="w-80 mt-2 hover:border-white" type="submit">
        Sign In
      </button>
    </form>
  );
};

export default LoginPage;
