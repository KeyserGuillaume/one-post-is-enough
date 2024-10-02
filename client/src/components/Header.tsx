type Props = {
  onLogout: () => void;
  onClickSettings?: () => void;
};

function Header({onLogout, onClickSettings}: Props) {
  return (
    <header className="bg-orange-100 p-3 flex flex-row w-full justify-between">
      <div className="flex-1"></div>
      <h1 className="mx-2">One Post Is Enough</h1>
      <div className="flex-1 flex flex-row justify-end pr-[10px]">
        {onClickSettings && (
          <button className="mr-2" onClick={onClickSettings}>
            Settings
          </button>
        )}
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
export default Header;
