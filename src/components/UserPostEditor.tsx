import {ChangeEvent, useEffect, useRef, useState} from 'react';
import {getToken} from '../libs/auth-service';
import config from '../aws-config.json';
import {isFileJpg} from '../libs/utils';

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

const fetchUserPost = async (signal: AbortSignal): Promise<string | null> => {
  const token = await getToken();
  if (token === null) {
    return null;
  }
  const headers = new Headers();
  headers.append('Authorization', token);
  headers.append('Accept', 'image/jpg');
  const response = await fetch(config.apiEndpointUrl + '/user-post', {
    headers,
    signal,
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

const deleteUserPost = async () => {
  const token = await getToken();
  if (token === null) {
    return false;
  }
  const headers = new Headers();
  headers.append('Authorization', token);
  const response = await fetch(config.apiEndpointUrl, {
    method: 'DELETE',
    headers,
  });
  if (response.status === 200) {
    console.log('User post was deleted');
  }
};

const UserPostEditor = () => {
  const [uploadedPost, setUploadedPost] = useState<null | string>(null);
  const abortControllerRef = useRef<AbortController>(new AbortController());

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    abortControllerRef.current.abort();
    if (e.target.files === null) {
      return;
    }
    const success = await uploadThePost(e.target.files[0]);
    if (success) {
      setUploadedPost(URL.createObjectURL(e.target.files[0].slice()));
    }
  };

  useEffect(() => {
    let ignore = false;
    abortControllerRef.current = new AbortController();
    async function startFetching() {
      try {
        const url = await fetchUserPost(abortControllerRef.current.signal);
        if (!ignore) {
          setUploadedPost(url);
        }
      } catch {}
    }
    startFetching();
    return () => {
      abortControllerRef.current.abort();
      ignore = true;
    };
  }, []);

  const handleDeletePost = () => {
    setUploadedPost(null);
    deleteUserPost();
  };

  return (
    <>
      <p className="max-w-prose mx-auto">
        You may submit a post if you wish. At the end of the day, one post will
        be randomly selected among all posts submitted today, and this will be
        the cover post for tomorrow. All other non-chosen submitted posts will
        be permanently deleted. This process preserves the precious time of all
        users of One Post Is Enough.
      </p>
      <p className="max-w-prose mx-auto mt-4">
        Uploaded posts should meet the following rules : no violence or nudity.
      </p>
      {uploadedPost === null && (
        <>
          <h2 className="mx-auto mt-4">Add Image:</h2>
          <input
            className="mx-auto mt-2"
            type="file"
            onChange={handleUpload}
            accept="image/jpg"
          />
        </>
      )}
      {uploadedPost && (
        <>
          <img
            className="mt-3 max-w-full lg:max-w-[1024px] mx-auto"
            src={uploadedPost}
            alt="This is the post that you've uploaded today"
          />
          <button className="mx-auto" onClick={handleDeletePost}>
            Delete post
          </button>
        </>
      )}
    </>
  );
};

export default UserPostEditor;
