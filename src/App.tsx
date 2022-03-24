import { v4 } from "uuid";
import { useEffect, useState } from "react";
import { ReactComponent as SearchIcon } from "./images/search.svg";
import Playlist from "./components/Playlist";
import { motion } from "framer-motion";

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
  const [searchedTerm, setSearchedTerm] = useState("");
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSecretSVG, setShowSecretSVG] = useState(false);
  const [logoClicked, setLogoClicked] = useState(false);

  useEffect(() => {
    setLogoClicked(true);
    setTimeout(() => setLogoClicked(false), 750);
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
          <div className="md:w-80 w-72 flex items-center space-x-2 bg-green-600 rounded-md pr-2 p-1">
            <input
              className="p-2 outline-0 bg-black w-full overflow-visible"
              type="text"
              placeholder="Search for songs or artists"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchedTerm(searchTerm);
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
          {searchResults.map((result) => (
            <Playlist playlist={result} searchedTerm={searchedTerm} />
          ))}
          {}
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
        <>
          <svg className="w-72 h-72" viewBox="0 0 100 100">
            <circle
              className="fill-green-600"
              cx="50"
              cy="50"
              r="40"
              onClick={() => {
                setLogoClicked(true);
                setTimeout(() => setLogoClicked(false), 750);
              }}
            />
            <motion.path
              variants={{
                first: {
                  d: [
                    "M 31 62 Q 50 56, 67 66",
                    "M 31 62 Q 50 30, 67 66",
                    "M 31 62 Q 50 60, 67 66",
                    "M 31 62 Q 50 56, 67 66",
                  ],
                  transition: {
                    duration: 0.6,
                    ease: "easeOut",
                  },
                },
              }}
              animate={logoClicked ? "first" : ""}
              className="stroke-black"
              d="M 31 62 Q 50 56, 67 66"
              fill="transparent"
              strokeLinecap="round"
              strokeWidth="5"
              strokeDashoffset="0"
            />
            <motion.path
              variants={{
                first: {
                  d: [
                    "M 29 49 Q 51 42, 72 54",
                    "M 29 49 Q 51 20, 72 54",
                    "M 29 49 Q 51 46, 72 54",
                    "M 29 49 Q 51 42, 72 54",
                  ],
                  transition: {
                    duration: 0.6,
                    ease: "easeOut",
                  },
                },
              }}
              animate={logoClicked ? "first" : ""}
              className="stroke-black"
              d="M 29 49 Q 51 42, 72 54"
              fill="transparent"
              strokeLinecap="round"
              strokeWidth="6"
            />
            <motion.path
              variants={{
                first: {
                  d: [
                    "M 26 36 Q 52 27 ,76 40",
                    "M 26 36 Q 52 10 ,76 40",
                    "M 26 36 Q 52 33 ,76 40",
                    "M 26 36 Q 52 27 ,76 40",
                  ],
                  transition: {
                    duration: 0.6,
                    ease: "easeOut",
                  },
                },
              }}
              animate={logoClicked ? "first" : ""}
              stroke="black"
              d="M 26 36 Q 52 27 , 76 40"
              fill="transparent"
              strokeLinecap="round"
              strokeWidth="7"
            />
          </svg>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-center p-4 rounded-full bg-green-600 flex space-x-2 items-center "
            onClick={(e) => login(e)}
          >
            <svg className="w-7 h-7" viewBox="0 0 100 100">
              <circle className="fill-white" cx="50" cy="50" r="40" />
              <path
                className="stroke-green-600"
                d="M 31 62 Q 50 56, 67 66"
                fill="transparent"
                strokeLinecap="round"
                strokeWidth="5"
                // strokeDasharray=" 1 8"
                strokeDashoffset="0"
              />
              <path
                className="stroke-green-600"
                d="M 29 49 Q 51 42, 72 54"
                fill="transparent"
                strokeLinecap="round"
                strokeWidth="6"
              />
              <path
                className="stroke-green-600"
                d="M 26 36 Q 52 27 , 76 40"
                fill="transparent"
                strokeLinecap="round"
                strokeWidth="7"
              />
            </svg>
            <p>Login with Spotify</p>
          </motion.button>
          <svg className="w-72 h-72" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradient" gradientTransform="rotate(90)">
                <stop
                  className="stop2 fill-green-600 text-green-600"
                  offset="10%"
                  stopColor="currentColor"
                />
                <stop
                  className="stop2 text-green-200"
                  offset="100%"
                  stopColor="currentColor"
                />
              </linearGradient>
              <radialGradient
                id="radial"
                cx="0.5"
                cy="0.5"
                fx="0.5"
                fy="0.5"
                r="0.1"
                spreadMethod="reflect"
              >
                <stop
                  className="stop2 fill-green-600 text-green-600"
                  offset="0%"
                  stopColor="currentColor"
                />
                <stop className="stop2" offset="100%" stopColor="white" />
              </radialGradient>
              <pattern
                id="pattern"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="10" height="10" fill="skyblue" />
                <circle
                  cx="5"
                  cy="5"
                  r="12"
                  fill="url(#radial)"
                  fillOpacity="0.5"
                />
                <rect
                  x="0"
                  y="0"
                  width="5"
                  height="5"
                  fill="blue"
                  fillOpacity="0.25"
                />
              </pattern>
            </defs>
            <circle fill="url(#pattern)" cx="50" cy="50" r="40" />
            <path
              className="stroke-black"
              d="M 31 62 Q 50 56, 67 66"
              fill="transparent"
              strokeLinecap="round"
              strokeWidth="5"
              strokeDashoffset="0"
            />
            <path
              className="stroke-black"
              d="M 29 49 Q 51 42, 72 54"
              fill="transparent"
              strokeLinecap="round"
              strokeWidth="6"
            />
            <path
              className="stroke-black"
              d="M 26 36 Q 52 27 , 76 40"
              fill="transparent"
              strokeLinecap="round"
              strokeWidth="7"
            />
          </svg>
          <button
            className="ml-16 text-center text-black p-4 rounded-md cursor-default"
            onClick={() => setShowSecretSVG(!showSecretSVG)}
          >
            Secret
          </button>
          <svg
            className={"w-80 h-80 " + (showSecretSVG ? "" : "hidden")}
            viewBox="0 0 100 100"
          >
            <circle className="fill-green-600" cx="50" cy="50" r="40" />
            <rect
              x="30"
              y="30"
              width="10"
              height="10"
              stroke="white"
              fill="transparent"
              strokeWidth="2"
            />
            <rect
              x="60"
              y="30"
              rx="1"
              ry="1"
              width="10"
              height="10"
              stroke="white"
              fill="transparent"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="65"
              rx="20"
              ry="5"
              stroke="white"
              fill="transparent"
              strokeWidth="5"
            />
            <line
              x1="10"
              x2="90"
              y1="15"
              y2="15"
              stroke="black"
              strokeWidth="10"
            />
            <polyline
              className="stroke-white"
              points="20 80, 10 60, 10 35, 20 20, 80 20, 90 35, 90 60, 80 80"
              fill="transparent"
              strokeWidth="5"
            />
            <polygon
              points="50 45 55 55 45 55"
              stroke="black"
              fill="transparent"
              strokeWidth="1"
            />
            <path
              d="M20,23 Q40,20 50,23 T90,23"
              fill="none"
              stroke="blue"
              strokeWidth="5"
            />
            <path
              d="M10 10 H 90 V 90 H 10 Z "
              stroke="red"
              fill="transparent"
            />
            <path d="M 10 10 C 20 20, 40 20, 50 10" stroke="purple" />
          </svg>
        </>
      )}
    </div>
  );
}

export default App;
