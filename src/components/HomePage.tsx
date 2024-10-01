import {useState} from 'react';
import Header from './Header';
import SettingsPage from './SettingsPage';
import {useTheOnePost} from '../hooks/useTheOnePost';
import UserPostEditor from './UserPostEditor';

type Props = {onLogout: () => void};

const HomePage = ({onLogout}: Props) => {
  const [displaySettings, setDisplaySettings] = useState(false);

  const imageUrl = useTheOnePost();

  const homePage = (
    <div className="w-full flex flex-col content-center flex-wrap text-center">
      <Header
        onLogout={onLogout}
        onClickSettings={() => setDisplaySettings(true)}
      />
      <div className="max-w-5xl flex flex-col flex-wrap mx-auto mt-10">
        <p className="max-w-prose mx-auto">
          Please find below the post for today, as well as the message of
          introduction that the author attached to their post submission :
        </p>
        <hr className="my-4"></hr>
        <div className="p-2 border-2 rounded-lg border-orange-100 mx-auto">
          <blockquote className="max-w-prose">No message yet</blockquote>
        </div>
        <div className="mx-auto">
          {imageUrl && (
            <img
              className="mt-3 max-w-full lg:max-w-[1024px] "
              src={imageUrl}
              alt="This is the image selected among everything that was posted today"
            />
          )}
        </div>
        <hr className="my-4"></hr>
        <UserPostEditor />
      </div>
    </div>
  );

  return displaySettings ? (
    <SettingsPage
      onLogout={onLogout}
      onExit={() => setDisplaySettings(false)}
    />
  ) : (
    homePage
  );
};

export default HomePage;
