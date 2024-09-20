import { SyntheticEvent, useState } from 'react';
import { confirmEmail, signUp } from '../libs/auth-service';


type Props = { onSignUpSuccess: () => void };

const SignUpPage = ({ onSignUpSuccess }: Props) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [hasSignedUp, setHasSignedUp] = useState(false);

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!hasSignedUp) {
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            const isSignedUp = await signUp(name, email, password);
            if (isSignedUp) {
                setHasSignedUp(true);
            }
        } else {
            try {
                await confirmEmail(email, verificationCode);
                onSignUpSuccess();
            } catch (error) {
                alert(`Email confirm failed: ${error}`);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <input
                id="name"
                className="w-80 mt-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
            />
            <input
                className="w-80 mt-2"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                className="w-80 mt-2"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <input
                className="w-80 mt-2"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
            />
            {hasSignedUp &&
                <input
                    className="w-80 mt-2"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Verification code, please check your emails"
                    required
                />}
            <button type="submit">{!hasSignedUp ? "Sign up" : "Verify code"}</button>
        </form>
    );
}

export default SignUpPage;