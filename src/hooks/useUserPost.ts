import {useState, useEffect} from 'react';
import {getToken} from '../libs/auth-service';
import config from '../aws-config.json';

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

export function useUserPost() {
  const [userPostImageUrl, setUserPostImageUrl] = useState<string | null>(null);
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
  return userPostImageUrl;
}
