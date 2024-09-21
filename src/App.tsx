import {useEffect, useState} from 'react';
import './App.css';
import NonAuthenticatedUserPage from './components/NonAuthenticatedUserPage';
import HomePage from './components/HomePage';
import {isSigningInNecessary, logOut} from './libs/auth-service';

function App() {
  const getIsAuthenticated = () => {
    return isSigningInNecessary();
  };

  useEffect(() => {
    getIsAuthenticated().then(result => setIsAuthenticated(result));
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticationSuccess = () => {
    setIsAuthenticated(true);
  };
  const handleLogout = async () => {
    await logOut();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserPage
        onAuthenticationSuccess={handleAuthenticationSuccess}
      />
    );
  } else {
    return <HomePage onLogout={handleLogout} />;
  }
}

export default App;
