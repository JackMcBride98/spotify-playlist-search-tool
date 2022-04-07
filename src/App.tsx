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
  const [errMsg, setErrMsg] = useState("");
  const [dots, setDots] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  useEffect(() => {
    const params = getHashParams();
    const accessToken = params.access_token;
    const state = params.state;
    const storedState = localStorage.getItem("spotifyAuthState");
    let timer;
    document.addEventListener("scroll", function () {
      if (document.scrollingElement.scrollTop > 500) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    });

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
          let findIt;
          let uncompressed;
          if (storedUserPlaylists) {
            const uncompressed = JSON.parse(
              LZstring.decompress(storedUserPlaylists)
            );
            findIt = uncompressed.find((el) => el.userID === result.id);
          }
          setIsLoadingPlaylists(true);
          let dotsInterval = setInterval(
            () => setDots((d) => (d.length > 2 ? "" : d + ".")),
            333
          );
          if (!findIt) {
            const userPlaylists2 = [];
            let priorRetryAfter;
            let playlistFetch = await fetch(
              `https://api.spotify.com/v1/users/${result.id}/playlists?offset=0&limit=50`,
              {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              }
            ).then((res) => {
              priorRetryAfter = res.headers.get("retry-after");
              return res.json();
            });
            if (playlistFetch?.error) {
              setErrMsg(playlistFetch?.error?.message);
              if (playlistFetch?.error?.status === 429) {
                setErrMsg(
                  (e) => e + " waiting for " + priorRetryAfter + " seconds"
                );
                await sleep(priorRetryAfter * 1000);
                setErrMsg("");
                playlistFetch.next = `https://api.spotify.com/v1/users/${result.id}/playlists?offset=0&limit=50`;
              }
            }
            if (playlistFetch.items) {
              userPlaylists2.push(...playlistFetch.items);
            }
            while (playlistFetch.next) {
              let priorRetryAfter2;
              playlistFetch = await fetch(playlistFetch.next, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              }).then((res) => {
                priorRetryAfter2 = res.headers.get("retry-after");
                return res.json();
              });
              if (playlistFetch?.error) {
                setErrMsg(playlistFetch?.error?.message);
                if (playlistFetch?.error?.status === 429) {
                  setErrMsg(
                    (e) => e + " waiting for " + priorRetryAfter2 + " seconds"
                  );
                  await sleep(priorRetryAfter2 * 1000);
                  setErrMsg("");
                  playlistFetch.next = `https://api.spotify.com/v1/users/${result.id}/playlists?offset=0&limit=50`;
                }
              }
              if (playlistFetch.items) {
                userPlaylists2.push(...playlistFetch.items);
              }
            }
            //Cleaning up the playlists so that they fit in local storage
            userPlaylists2.forEach((playlist) => {
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
            setTotalPlaylists(userPlaylists2.length);
            for (let i = 0; i < userPlaylists2.length; i++) {
              let playlistTracks = [];
              let firstRetryAfter;
              let playlistFetch2 = await fetch(userPlaylists2[i].tracks.href, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              }).then((res) => {
                firstRetryAfter = res.headers.get("retry-after");
                return res.json();
              });
              if (playlistFetch2?.error) {
                setErrMsg(playlistFetch2?.error?.message);
                if (playlistFetch2?.error?.status === 429) {
                  setErrMsg(
                    (e) => e + " waiting for " + firstRetryAfter + " seconds"
                  );
                  await sleep(firstRetryAfter * 1000);
                  setErrMsg("");
                  playlistFetch2.next = userPlaylists2[i].tracks.href;
                }
              }
              if (playlistFetch2.items) {
                playlistTracks.push(...playlistFetch2.items);
              }
              while (playlistFetch2.next) {
                let oldFetchNext = playlistFetch2.next;
                let retryAfter;
                playlistFetch2 = await fetch(playlistFetch2.next, {
                  headers: {
                    Authorization: "Bearer " + accessToken,
                  },
                }).then((res) => {
                  retryAfter = res.headers.get("retry-after");
                  return res.json();
                });
                if (playlistFetch2?.error) {
                  setErrMsg(playlistFetch2?.error?.message);
                  if (playlistFetch2?.error?.status === 429) {
                    setErrMsg(
                      (e) => e + " waiting for " + retryAfter + " seconds"
                    );
                    await sleep(retryAfter * 1000);
                    setErrMsg("");
                    playlistFetch2.next = oldFetchNext;
                  }
                }
                if (playlistFetch2.items) {
                  playlistTracks.push(...playlistFetch2.items);
                }
              }
              userPlaylists2[i].tracks = playlistTracks.map((info) =>
                _.pick(info.track, ["name", "artists", "id"])
              );
              setUserPlaylists(userPlaylists2.slice(0, i + 1));
            }
            localStorage.setItem(
              "userPlaylists",
              LZstring.compress(
                JSON.stringify([
                  {
                    userID: result.id,
                    playlists: userPlaylists2,
                    time: Date.now(),
                  },
                  ...(uncompressed ? uncompressed : []),
                ])
              )
            );

            setIsLoadingPlaylists(false);
            clearInterval(dotsInterval);
          } else {
            setUserPlaylists(findIt.playlists);
            setTotalPlaylists(findIt.playlists.length);
            setIsLoadingPlaylists(false);
            clearInterval(dotsInterval);
            const oneHourInMs = 3600000;
            if (Date.now() - findIt.time > oneHourInMs) {
              const userPlaylists2 = [];
              let priorRetryAfter;
              let playlistFetch = await fetch(
                `https://api.spotify.com/v1/users/${result.id}/playlists?offset=0&limit=50`,
                {
                  headers: {
                    Authorization: "Bearer " + accessToken,
                  },
                }
              ).then((res) => {
                priorRetryAfter = res.headers.get("retry-after");
                return res.json();
              });
              if (playlistFetch?.error) {
                setErrMsg(playlistFetch?.error?.message);
                if (playlistFetch?.error?.status === 429) {
                  setErrMsg(
                    (e) => e + " waiting for " + priorRetryAfter + " seconds"
                  );
                  await sleep(priorRetryAfter * 1000);
                  setErrMsg("");
                  playlistFetch.next = `https://api.spotify.com/v1/users/${result.id}/playlists?offset=0&limit=50`;
                }
              }
              if (playlistFetch.items) {
                userPlaylists2.push(...playlistFetch.items);
              }
              while (playlistFetch.next) {
                let priorRetryAfter2;
                playlistFetch = await fetch(playlistFetch.next, {
                  headers: {
                    Authorization: "Bearer " + accessToken,
                  },
                }).then((res) => {
                  priorRetryAfter2 = res.headers.get("retry-after");
                  return res.json();
                });
                if (playlistFetch?.error) {
                  setErrMsg(playlistFetch?.error?.message);
                  if (playlistFetch?.error?.status === 429) {
                    setErrMsg(
                      (e) => e + " waiting for " + priorRetryAfter2 + " seconds"
                    );
                    await sleep(priorRetryAfter2 * 1000);
                    setErrMsg("");
                    playlistFetch.next = `https://api.spotify.com/v1/users/${result.id}/playlists?offset=0&limit=50`;
                  }
                }
                if (playlistFetch.items) {
                  userPlaylists2.push(...playlistFetch.items);
                }
              }
              //* Cleaning up the playlists so that they fit in local storage
              userPlaylists2.forEach((playlist) => {
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
              setTotalPlaylists(userPlaylists2.length);
              for (let i = 0; i < userPlaylists2.length; i++) {
                let playlistTracks = [];
                let firstRetryAfter;
                let playlistFetch2 = await fetch(
                  userPlaylists2[i].tracks.href,
                  {
                    headers: {
                      Authorization: "Bearer " + accessToken,
                    },
                  }
                ).then((res) => {
                  firstRetryAfter = res.headers.get("retry-after");
                  return res.json();
                });
                if (playlistFetch2?.error) {
                  setErrMsg(playlistFetch2?.error?.message);
                  if (playlistFetch2?.error?.status === 429) {
                    setErrMsg(
                      (e) => e + " waiting for " + firstRetryAfter + " seconds"
                    );
                    await sleep(firstRetryAfter * 1000);
                    setErrMsg("");
                    playlistFetch2.next = userPlaylists2[i].tracks.href;
                  }
                }
                if (playlistFetch2.items) {
                  playlistTracks.push(...playlistFetch2.items);
                }
                while (playlistFetch2.next) {
                  let oldFetchNext = playlistFetch2.next;
                  let retryAfter;
                  playlistFetch2 = await fetch(playlistFetch2.next, {
                    headers: {
                      Authorization: "Bearer " + accessToken,
                    },
                  }).then((res) => {
                    retryAfter = res.headers.get("retry-after");
                    return res.json();
                  });
                  if (playlistFetch2?.error) {
                    setErrMsg(playlistFetch2?.error?.message);
                    if (playlistFetch2?.error?.status === 429) {
                      setErrMsg(
                        (e) => e + " waiting for " + retryAfter + " seconds"
                      );
                      await sleep(retryAfter * 1000);
                      setErrMsg("");
                      playlistFetch2.next = oldFetchNext;
                    }
                  }
                  if (playlistFetch2.items) {
                    playlistTracks.push(...playlistFetch2.items);
                  }
                }
                userPlaylists2[i].tracks = playlistTracks.map((info) =>
                  _.pick(info.track, ["name", "artists", "id"])
                );

                let theOne = findIt.playlists.find(
                  (el) => el.id === userPlaylists2[i].id
                );
                if (theOne) {
                  //* current playlist - replace in there
                  let index = findIt.playlists.indexOf(theOne);
                  let newPlaylists = [
                    ...findIt.playlists.slice(0, index),
                    userPlaylists2[i],
                    ...findIt.playlists.slice(
                      index + 1,
                      findIt.playlists.length
                    ),
                  ];
                  setUserPlaylists(newPlaylists);
                  findIt.playlists = newPlaylists;
                } else {
                  //* new playlist, add to start of array
                  setUserPlaylists([userPlaylists2[i], ...findIt.playlists]);
                  findIt.playlists = [userPlaylists2[i], ...findIt.playlists];
                }
                if (i === 25) {
                  //* save the first 25 playlists to localstorage for the cases where the user isnt on the site for very long
                  localStorage.setItem(
                    "userPlaylists",
                    LZstring.compress(
                      JSON.stringify([
                        {
                          userID: result.id,
                          playlists: findIt.playlists,
                          time: Date.now(),
                        },
                        ...(uncompressed ? uncompressed : []),
                      ])
                    )
                  );
                }
              }
              setUserPlaylists(userPlaylists2);
              localStorage.setItem(
                "userPlaylists",
                LZstring.compress(
                  JSON.stringify([
                    {
                      userID: result.id,
                      playlists: userPlaylists2,
                      time: Date.now(),
                    },
                    ...(uncompressed ? uncompressed : []),
                  ])
                )
              );
            }
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
    const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const redirect_uri =
      process.env.REACT_APP_VERCEL_URL || "https://" + process.env.VERCEL_URL;
    console.log(redirect_uri);
    const state = v4().replace(/-/g, "").slice(0, 16);

    localStorage.setItem("spotifyAuthState", state);
    const scope =
      "user-read-private user-read-email playlist-read-private playlist-read-collaborative";

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
    setSearchedTerm(searchTerm);
    if (!searchTerm) {
      return;
    }
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
    <div className="app flex flex-col items-center space-y-4 text-white w-full pb-4 relative h-full overflow-hidden">
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
          <SearchBar search={search} />
          {errMsg && <p className="text-red-600">{errMsg}</p>}
          {isLoadingPlaylists && (
            <p>
              Loading your playlists
              <span className="w-2 inline-block">{dots}</span>{" "}
              {userPlaylists.length} / {totalPlaylists} <br />
              <span className="text-xs -mt-1">
                (You can search just the loaded ones)
              </span>
            </p>
          )}
          {!isLoadingPlaylists && (
            <p>Loaded {userPlaylists.length} playlists</p>
          )}

          {searchedTerm && (
            <p>
              {searchResults.length} matching out of {totalPlaylists} total
              playlists
            </p>
          )}
          {searchResults.length > 0 && (
            <motion.button
              onClick={() =>
                document.scrollingElement.scrollIntoView({ behavior: "smooth" })
              }
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={
                "rounded-full text-black text-xl bg-green-600 w-12 h-12 md:w-20 md:h-20  text-center fixed transition-all bottom-2 md:bottom-4 right-2 md:right-28 opacity-80 hover:opacity-100 focus:opacity-100 " +
                (!showScrollToTop && "-bottom-24 md:-bottom-24")
              }
            >
              <svg
                className={"w-12 h-12 md:w-20 md:h-20"}
                viewBox="0 0 100 100"
              >
                <polygon
                  points="47,75 47,50 38,50 50,28 62,50 53,50 53,75"
                  fill="black"
                  stroke="black"
                />
              </svg>
            </motion.button>
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
              window.location.href = "/";
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
