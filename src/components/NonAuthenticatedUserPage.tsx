import { useState } from 'react';
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

    const baseStyle = "bg-white hover:bg-slate-50 hover:border-white rounded-lg focus:outline-none";
    const styles = new Map<string, string>();
    for (const key of Object.values(AuthenticationTab)){
        styles.set(key, baseStyle);
    }
    styles.set(authenticationTab, baseStyle + ' bg-orange-100 text-orange-500');    

    return (
        <div className="p-2 rounded-lg border-orange-100 border-4">
            <div className="flex flex-row justify-start">
                <button onClick={()=>setAuthenticationTab(AuthenticationTab.LOGIN)} className={styles.get(AuthenticationTab.LOGIN)}>
                    {AuthenticationTab.LOGIN}
                </button>
                <button onClick={()=>setAuthenticationTab(AuthenticationTab.SIGN_UP)} className={styles.get(AuthenticationTab.SIGN_UP)}>
                    {AuthenticationTab.SIGN_UP}
                </button>
                <button onClick={()=>setAuthenticationTab(AuthenticationTab.RESET_PASSWORD)} className={styles.get(AuthenticationTab.RESET_PASSWORD)}>
                    {AuthenticationTab.RESET_PASSWORD}
                </button>
            </div>
            {(authenticationTab===AuthenticationTab.LOGIN) && <LoginPage onAuthenticationSuccess={onAuthenticationSuccess}/>}
            {(authenticationTab===AuthenticationTab.SIGN_UP) && <SignUpPage onSignUpSuccess={handleSignUpSuccess}/>}
            {(authenticationTab===AuthenticationTab.RESET_PASSWORD) && <ResetPasswordPage onResetSuccess={handleResetSuccess}/>}
        </div>
    )

}

export default NonAuthenticatedUserPage;