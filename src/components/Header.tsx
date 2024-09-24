type Props = {onLogout: () => void};

function Header({onLogout}: Props) {
  // there is a useless div with flex-grow and transparent text
  // it is a hack to keep the page title centered
  return (
    <header className="bg-orange-100 p-2 flex flex-row">
      <div className="grow text-transparent select-none">Logout</div>
      <h1>One Post Is Enough</h1>
      <div className="grow flex flex-row justify-end">
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
export default Header;
