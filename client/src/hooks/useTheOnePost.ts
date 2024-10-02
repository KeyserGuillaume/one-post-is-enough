import {useState, useEffect} from 'react';
import {getToken} from '../libs/auth-service';
import config from '../aws-config.json';

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
  }).catch(e => console.log(e));
  if (response && response.status === 200) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  } else {
    return null;
  }
};

export function useTheOnePost() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
  return imageUrl;
}
