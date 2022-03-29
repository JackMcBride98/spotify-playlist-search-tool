import { v4 } from "uuid";
import { useEffect, useState } from "react";
import Playlist from "./components/Playlist";
import { motion } from "framer-motion";
import LoginPage from "./components/LoginPage";
import _ from "lodash";
import LZstring from "lz-string";
import SearchBar from "./components/SearchBar";

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
  const [searchedTerm, setSearchedTerm] = useState("");
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [totalPlaylists, setTotalPlaylists] = useState(0);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  useEffect(() => {
    const params = getHashParams();
    const accessToken = params.access_token;
    const state = params.state;
    const storedState = localStorage.getItem("spotifyAuthState");
    let timer;

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
          const storedUserPlaylists = localStorage.getItem("userPlaylists");
          setIsLoadingPlaylists(true);
          if (!storedUserPlaylists) {
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
            //Cleaning up the playlists so that they fit in local storage
            userPlaylists.forEach((playlist) => {
              delete playlist.collaborative;
              delete playlist.href;
              delete playlist.primary_color;
              delete playlist.public;
              delete playlist.snapshot_id;
              delete playlist.type;
              delete playlist.uri;
              delete playlist.owner.external_urls;
              delete playlist.owner.href;
              delete playlist.owner.id;
              delete playlist.owner.type;
              delete playlist.owner.uri;
            });
            setTotalPlaylists(userPlaylists.length);
            for (let i = 0; i < userPlaylists.length; i++) {
              let playlistTracks = [];
              let playlistFetch2 = await fetch(userPlaylists[i].tracks.href, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              }).then((res) => res.json());
              if (playlistFetch2.items) {
                playlistTracks.push(...playlistFetch2.items);
              }
              while (playlistFetch2.next) {
                playlistFetch2 = await fetch(playlistFetch2.next, {
                  headers: {
                    Authorization: "Bearer " + accessToken,
                  },
                }).then((res) => res.json());
                if (playlistFetch2.items) {
                  playlistTracks.push(...playlistFetch2.items);
                }
              }
              userPlaylists[i].tracks = playlistTracks.map((info) =>
                _.pick(info.track, ["name", "artists", "id"])
              );
              setUserPlaylists(userPlaylists.slice(0, i + 1));
            }
            console.log(JSON.stringify(userPlaylists).length);
            console.log(
              LZstring.compress(JSON.stringify(userPlaylists)).length
            );
            localStorage.setItem(
              "userPlaylists",
              LZstring.compress(JSON.stringify(userPlaylists))
            );
            setIsLoadingPlaylists(false);
          } else {
            const uncompressedPlaylists = JSON.parse(
              LZstring.decompress(storedUserPlaylists)
            );
            setUserPlaylists(uncompressedPlaylists);
            setTotalPlaylists(uncompressedPlaylists.length);
            timer = setTimeout(() => setIsLoadingPlaylists(false), 1500);
          }
        };
        fetchUserInfo();
      } else {
        setAccessToken("");
      }
    }

    return () => {
      clearTimeout(timer);
    };
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
  const search = (searchTerm) => {
    setSearchResults([]);
    const results = [];
    userPlaylists.forEach((playlist) => {
      for (let i = 0; i < playlist.tracks.length; i++) {
        if (
          playlist?.tracks[i]?.name
            ?.toUpperCase()
            .includes(searchTerm.toUpperCase())
        ) {
          if (!results.includes(playlist)) {
            playlist.firstMatchIndex = i;
            results.push(playlist);
            break;
          }
        }
        if (
          playlist?.tracks[i]?.artists?.some((artist) =>
            artist?.name?.toUpperCase().includes(searchTerm.toUpperCase())
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
    <div className="app flex flex-col items-center space-y-4 text-white w-full pb-4">
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
          <SearchBar search={search} setSearchedTerm={setSearchedTerm} />
          {isLoadingPlaylists && (
            <p>
              Loading your playlists... {userPlaylists.length} /{" "}
              {totalPlaylists}
            </p>
          )}

          {searchedTerm && (
            <p>
              {searchResults.length} matching out of {totalPlaylists} total
              playlists
            </p>
          )}
          {searchResults.map((result, index) => (
            <Playlist
              playlist={result}
              searchedTerm={searchedTerm}
              key={result?.id || index}
            />
          ))}
          {searchedTerm && searchResults.length === 0 && (
            <p>No results found</p>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-center p-4 border rounded-md"
            onClick={() => {
              setAccessToken("");
              window.location.href = "";
            }}
          >
            Logout
          </motion.button>
        </>
      ) : (
        <LoginPage login={login} />
      )}
    </div>
  );
}

export default App;
