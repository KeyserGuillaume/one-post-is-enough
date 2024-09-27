import {ChangeEvent, useEffect, useState} from 'react';
import config from '../aws-config.json';
import {getToken} from '../libs/auth-service';
import {isFileJpg} from '../libs/utils';
import Header from './Header';
import SettingsPage from './SettingsPage';

type Props = {onLogout: () => void};

const fetchTheOnePost = async (): Promise<string | null> => {
  const token = await getToken();
  if (token === null) {
    return null;
  }
  const headers = new Headers();
  headers.append('Authorization', token);
  headers.append('Accept', 'image/jpg');
  const response = await fetch(config.apiEndpointUrl, {
    headers,
  });
  if (response.status === 200) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  } else {
    return null;
  }
};

const fetchUserPost = async (): Promise<string | null> => {
  const token = await getToken();
  if (token === null) {
    return null;
  }
  const headers = new Headers();
  headers.append('Authorization', token);
  headers.append('Accept', 'image/jpg');
  const response = await fetch(config.apiEndpointUrl + '/user-post', {
    headers,
  });
  if (response.status === 200) {
    const responseText = await response.text();
    const base64Decoded = await fetch(`data:image/jpeg;base64,${responseText}`);
    const blob2 = await base64Decoded.blob();
    const url = URL.createObjectURL(blob2);
    return url;
  } else {
    return null;
  }
};

const uploadThePost = async (file: File): Promise<boolean> => {
  const token = await getToken();
  if (token === null) {
    return false;
  }
  const headers = new Headers();
  headers.append('Authorization', token);

  const fileIsCorrectFormat = await isFileJpg(file);

  if (!fileIsCorrectFormat) {
    window.alert('File is not jpg');
    return false;
  }

  if (file.size > 1e6) {
    window.alert('File is greater than 1 Mb');
    return false;
  }

  const response = await fetch(config.apiEndpointUrl, {
    method: 'POST',
    headers,
    body: file,
  });
  if (response.status === 200) {
    return true;
  } else {
    try {
      const responseMessage = await response.json();
      console.log(responseMessage);
    } catch {}
  }
  return false;
};

const HomePage = ({onLogout}: Props) => {
  const [displaySettings, setDisplaySettings] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [userPostImageUrl, setUserPostImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<null | string>(null);

  useEffect(() => {
    let ignore = false;
    async function startFetching() {
      const url = await fetchTheOnePost();
      if (!ignore) {
        setImageUrl(url);
      }
    }
    startFetching();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function startFetching() {
      const url = await fetchUserPost();
      if (!ignore) {
        setUserPostImageUrl(url);
      }
    }
    startFetching();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files === null) {
      return;
    }
    const success = await uploadThePost(e.target.files[0]);
    if (success) {
      setFile(URL.createObjectURL(e.target.files[0].slice()));
    }
  };

  const homePage = (
    <div className="w-full flex flex-col content-center flex-wrap">
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
        <p className="max-w-prose mx-auto">
          You may submit a post if you wish. At the end of the day, one post
          will be randomly selected among all posts submitted today, and this
          will be the cover post for tomorrow. All other non-chosen submitted
          posts will be permanently deleted. This process preserves the precious
          time of all users of One Post Is Enough.
        </p>
        <p className="max-w-prose mx-auto mt-2">
          Uploaded posts should meet the following rules : no violence or
          nudity.
        </p>
        {file === null && userPostImageUrl === null && (
          <>
            <h2 className="mx-auto mt-4">Add Image:</h2>
            <input
              className="mx-auto mt-2"
              type="file"
              onChange={handleChange}
              accept="image/jpg"
            />
          </>
        )}
        {file && <img src={file} />}
        {userPostImageUrl && (
          <img
            className="mt-3 max-w-full lg:max-w-[1024px] mx-auto"
            src={userPostImageUrl}
            alt="This is the post that you've uploaded today"
          />
        )}
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
