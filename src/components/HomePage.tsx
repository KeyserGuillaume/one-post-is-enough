import {ChangeEvent, useState} from 'react';
import config from '../aws-config.json';
import {getToken} from '../libs/auth-service';
import {isFileJpg} from '../libs/utils';

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
  console.log(response);
  if (response.status === 200) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<null | string>(null);

  const handleClick = async () => {
    const url = await fetchTheOnePost();
    setImageUrl(url);
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files === null) {
      return;
    }
    const success = await uploadThePost(e.target.files[0]);
    if (success) {
      setFile(URL.createObjectURL(e.target.files[0].slice()));
    }
  };

  return (
    <div>
      <h1>Hello World</h1>
      <p>You are authenticated !</p>
      <button onClick={handleClick}> Test api </button>
      <button onClick={onLogout}>Logout</button>
      {imageUrl && (
        <img
          src={imageUrl}
          alt="This is the image selected among everything that was posted today"
        />
      )}
      <h2>Add Image:</h2>
      <input type="file" onChange={handleChange} accept="image/jpg" />
      {file && <img src={file} />}
    </div>
  );
};

export default HomePage;
