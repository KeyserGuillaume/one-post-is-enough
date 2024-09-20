import { useState } from 'react';
// import { confirmEmail, signIn, signUp } from '../libs/auth-service';
import LoginPage from './LoginPage';
import SignUpPage from './SignUpPage';
import ResetPasswordPage from './ResetPasswordPage';

type Props = {onAuthenticationSuccess: ()=>void};

enum AuthenticationTab {
  LOGIN = 'login',
  SIGN_UP = 'sign up',
  RESET_PASSWORD = 'reset password'
}

const NonAuthenticatedUserPage = ({onAuthenticationSuccess}: Props) => {
    const [authenticationTab, setAuthenticationTab] = useState(AuthenticationTab.LOGIN);

    const handleSignUpSuccess = ()=> setAuthenticationTab(AuthenticationTab.LOGIN);
    const handleResetSuccess = ()=> setAuthenticationTab(AuthenticationTab.LOGIN);

    return (
        <div>
            <div className="flex flex-row justify-start">
                <button onClick={()=>setAuthenticationTab(AuthenticationTab.LOGIN)}>
                    {AuthenticationTab.LOGIN}
                </button>
                <button onClick={()=>setAuthenticationTab(AuthenticationTab.SIGN_UP)}>
                    {AuthenticationTab.SIGN_UP}
                </button>
                <button onClick={()=>setAuthenticationTab(AuthenticationTab.RESET_PASSWORD)}>
                    {AuthenticationTab.RESET_PASSWORD}
                </button>
            </div>
            {(authenticationTab===AuthenticationTab.LOGIN) && <LoginPage onAuthenticationSuccess={onAuthenticationSuccess}/>}
            {(authenticationTab===AuthenticationTab.SIGN_UP) && <SignUpPage onSignUpSuccess={handleSignUpSuccess}/>}
            {(authenticationTab===AuthenticationTab.RESET_PASSWORD) && <ResetPasswordPage onResetSuccess={handleResetSuccess}/>}
        </div>
    )

}


// const NonAuthenticatedUserPage = ({onAuthenticationSuccess}: Props) => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [verificationCode, setVerificationCode] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [isSignUp, setIsSignUp] = useState(false);
//   const handleSignIn = async (e: { preventDefault: () => void; }) => {
//     e.preventDefault();
//     await signIn(email, password);
//   };

//   const handleSignUp = async (e: { preventDefault: () => void; }) => {
//     e.preventDefault();
//     if (password !== confirmPassword) {
//       alert('Passwords do not match');
//       return;
//     }
//     await signUp(name, email, password);
//   };

//   const handleEmailConfirm = async () => {
//     try {
//       await confirmEmail(email, verificationCode);
//       onAuthenticationSuccess();
//     } catch (error) {
//       alert(`Email confirm failed: ${error}`);
//     }
//   }

//   return (
//     <div className="loginForm">
//       <h1>Welcome</h1>
//       <h4>{isSignUp ? 'Sign up to create an account' : 'Sign in to your account'}</h4>
//       <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
//         {isSignUp && (
//           <div>
//             <input
//               className="inputText"
//               id="name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="Name"
//               required
//             />
//           </div>
//         )}
//         <div>
//           <input
//             className="inputText"
//             id="email"
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="Email"
//             required
//           />
//         </div>
//         <div>
//           <input
//             className=""
//             id="password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Password"
//             required
//           />
//         </div>
//         {isSignUp && (
//           <div>
//             <input
//               className="inputText"
//               id="confirmPassword"
//               type="password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               placeholder="Confirm Password"
//               required
//             />
//           </div>
//         )}
//         <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
//       </form>
//       <button onClick={() => setIsSignUp(!isSignUp)}>
//         {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
//       </button>

//       <div>
//           <input
//             className="inputText"
//             id="verificationCode"
//             value={verificationCode}
//             onChange={(e) => setVerificationCode(e.target.value)}
//             placeholder="verification code"
//             required
//           />
//       </div>
//       <button onClick={() => handleEmailConfirm()}>
//         {'Confirm email'}
//       </button>
//     </div>
//   );
// };

export default NonAuthenticatedUserPage;