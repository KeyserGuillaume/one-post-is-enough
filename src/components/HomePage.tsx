type Props = {onLogout: ()=>void};

const HomePage = ({onLogout}: Props) => {

  return (
    <div>
      <h1>Hello World</h1>
      <p>You are authenticated !</p>
      {<button onClick={onLogout}>Logout</button>}
    </div>
  );
};

export default HomePage;