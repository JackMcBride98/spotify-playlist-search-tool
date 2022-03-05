import { v4 } from "uuid";
import { useEffect, useState } from "react";

interface Params {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  state: string;
  error?: string;
}

function getHashParams(): Params {
  let hashParams: Params = { state: null };
  let e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

function App() {
  const [accessToken, setAccessToken] = useState("");
  useEffect(() => {
    const params = getHashParams();
    console.log(params);
    const accessToken = params.access_token;
    const state = params.state;
    const storedState = localStorage.getItem("spotifyAuthState");

    if (accessToken && (state == null || state !== storedState)) {
      setAccessToken("");
    } else {
      localStorage.removeItem("spotifyAuthState");
      if (accessToken) {
        setAccessToken(accessToken);
      } else {
        setAccessToken("");
      }
    }

    return () => {};
  }, []);

  const login = (e) => {
    e.preventDefault();
    const client_id = "09741050c3a14a3e8e53ecd9b981c185";
    const redirect_uri = "http://localhost:3000";

    const state = v4().replace(/-/g, "").slice(0, 16);
    console.log(state);

    localStorage.setItem("spotifyAuthState", state);
    const scope = "user-read-private user-read-email";

    let url = "https://accounts.spotify.com/authorize";
    url += "?response_type=token";
    url += "&client_id=" + encodeURIComponent(client_id);
    url += "&scope=" + encodeURIComponent(scope);
    url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
    url += "&state=" + encodeURIComponent(state);

    window.location.href = url;
  };

  return (
    <div className="app flex flex-col items-center">
      <h1 className="p-4 text-center text-3xl font-semibold">
        Spotify Playlist Searcher Tool
      </h1>
      {accessToken ? (
        <div>Access token </div>
      ) : (
        <button
          onClick={(e) => login(e)}
          className="text-center p-4 border rounded-md"
        >
          Login
        </button>
      )}
    </div>
  );
}

export default App;
