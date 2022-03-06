import { v4 } from "uuid";
import { useEffect, useState } from "react";
import { ReactComponent as SearchIcon } from "./images/search.svg";
interface Params {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  state: string;
  error?: string;
}

interface UserProfile {
  country: string;
  display_name: string;
  email: string;
  explicit_content: { filter_enabled: boolean; filter_locked: boolean };
  external_urls: { spotfiy: string };
  followers: { href: string; total: number };
  href: string;
  id: string;
  images: Array<{ url: string; height: number; width: number }>;
  product: string;
  type: string;
  uri: string;
}

//TODO: implement typing of playlists and tracks

//TODO: error handling

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
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(
    undefined
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const params = getHashParams();
    const accessToken = params.access_token;
    const state = params.state;
    const storedState = localStorage.getItem("spotifyAuthState");

    if (accessToken && (state == null || state !== storedState)) {
      setAccessToken("");
    } else {
      localStorage.removeItem("spotifyAuthState");
      if (accessToken) {
        const fetchUserInfo = async () => {
          const result: UserProfile = await fetch(
            "https://api.spotify.com/v1/me",
            {
              headers: {
                Authorization: "Bearer " + accessToken,
              },
            }
          ).then((res) => res.json());
          setUserProfile(result);
          setAccessToken(accessToken);
          const userPlaylists = [];
          let playlistFetch = await fetch(
            `https://api.spotify.com/v1/users/${result.id}/playlists?offset=0&limit=50`,
            {
              headers: {
                Authorization: "Bearer " + accessToken,
              },
            }
          ).then((res) => res.json());
          userPlaylists.push(...playlistFetch.items);
          while (playlistFetch.next) {
            playlistFetch = await fetch(playlistFetch.next, {
              headers: {
                Authorization: "Bearer " + accessToken,
              },
            }).then((res) => res.json());
            userPlaylists.push(...playlistFetch.items);
          }
          const playlistsTracksInfo = await Promise.all(
            userPlaylists.map(async (playlist) => {
              const playlistTracks = [];
              let playlistFetch2 = await fetch(playlist.tracks.href, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              }).then((res) => res.json());
              playlistTracks.push(...playlistFetch2.items);
              while (playlistFetch2.next) {
                playlistFetch2 = await fetch(playlistFetch2.next, {
                  headers: {
                    Authorization: "Bearer " + accessToken,
                  },
                }).then((res) => res.json());
                playlistTracks.push(...playlistFetch2.items);
              }
              return playlistTracks;
            })
          );
          userPlaylists.forEach((playlist, index) => {
            playlist.tracks = playlistsTracksInfo[index].map(
              (info) => info.track
            );
          });
          setUserPlaylists(userPlaylists);
        };
        fetchUserInfo();
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
  const search = () => {
    const results = [];
    userPlaylists.forEach((playlist) => {
      for (let i = 0; i < playlist.tracks.length; i++) {
        if (
          playlist.tracks[i].name
            .toUpperCase()
            .includes(searchTerm.toUpperCase())
        ) {
          if (!results.includes(playlist)) {
            playlist.firstMatchIndex = i;
            results.push(playlist);
            break;
          }
        }
        if (
          playlist.tracks[i].artists.some((artist) =>
            artist.name.toUpperCase().includes(searchTerm.toUpperCase())
          )
        ) {
          playlist.firstMatchIndex = i;
          results.push(playlist);
          break;
        }
      }
    });
    setSearchResults(results);
  };
  return (
    <div className="app flex flex-col items-center space-y-4 text-white w-full">
      <h1 className=" text-center text-xl lg:text-3xl font-semibold">
        Spotify Playlist Search Tool
      </h1>
      {accessToken ? (
        <>
          <p>Hello {userProfile?.display_name.split(" ")[0]}</p>
          <img
            className="rounded-full"
            src={userProfile?.images[0]?.url}
            width={150}
            height={150}
            alt="User's spotify profile"
          ></img>
          <div className="md:w-80 w-72 flex items-center space-x-2 bg-green-600 rounded-md pr-2 p-1">
            <input
              className="p-2 outline-0 bg-black w-full overflow-visible"
              type="text"
              placeholder="Search for songs or artists"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  search();
                }
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => search()}>
              <SearchIcon className="w-5 h-5 fill-black bg-green-600" />
            </button>
          </div>
          {/* Implement displaying search results */}
          {searchResults.map((result) => (
            <p className="text-white">{result.name}</p>
          ))}
          <button
            className="text-center p-4 border rounded-md"
            onClick={() => {
              setAccessToken("");
              window.location.href = "";
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <button
          className="text-center p-4 border rounded-md"
          onClick={(e) => login(e)}
        >
          Login
        </button>
      )}
    </div>
  );
}

export default App;
