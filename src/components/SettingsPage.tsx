import {useEffect, useState} from 'react';
import {getUserAttributes, handleDeleteUser} from '../libs/auth-service';
import Header from './Header';

type Props = {
  onExit: () => void;
  onLogout: () => void;
};

const SettingsPage = ({onExit, onLogout}: Props) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    let ignore = false;
    async function startFetching() {
      const {name, email} = await getUserAttributes();
      if (!ignore) {
        if (name != null) {
          setUserName(name);
        }
        if (email != null) {
          setUserEmail(email);
        }
      }
    }
    startFetching();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <Header onLogout={onLogout}></Header>
      <div className="flex flex-col max-w-5xl justify-center mt-10">
        <label> Name </label>
        <input value={userName} disabled></input>
        <label className="mt-4"> Email</label>
        <input value={userEmail} disabled></input>
        <button
          className="mt-6"
          onClick={async () => {
            await handleDeleteUser();
            onLogout();
          }}
        >
          Delete Acccount
        </button>
        <p className="text-sm">
          Account deletion is permanent. Please be certain.
        </p>
        <button className="mt-10" onClick={onExit}>
          Back to home page
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
