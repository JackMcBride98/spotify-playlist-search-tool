import { useEffect, useRef, useState } from "react";

export default function Playlist({ playlist, searchedTerm }) {
  const ref = useRef(null);
  const firstMatchRef = useRef(null);
  const [firstMatchIndex, setFirstMatchIndex] = useState(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollBehaviour = "auto";
      ref.current.scrollTop = 0;
      const firstMatch = playlist.tracks.find(
        (track) =>
          track.name.toUpperCase().includes(searchedTerm.toUpperCase()) ||
          track.artists.some((artist) =>
            artist.name.toUpperCase().includes(searchedTerm.toUpperCase())
          )
      );
      setFirstMatchIndex(playlist.tracks.indexOf(firstMatch));
      setTimeout(() => {
        ref.current.scrollBehaviour = "smooth";
        ref.current.scrollTop =
          firstMatchRef.current.offsetTop - ref.current.offsetTop;
      }, 500);
    }
  }, [searchedTerm, playlist.tracks]);

  console.log(playlist);

  return (
    <div className="m-2 p-2 md:w-full md: max-w-md justify-start w-72 border-gray-600 border-2 rounded-md">
      <div className="flex space-x-4">
        <img
          className="h-20 w-20"
          src={playlist?.images[1]?.url || playlist?.images[0]?.url}
          // height={75}
          // width={75}
          alt="playlist"
        ></img>
        <div className="w-full">
          <h1 className="text-lg">{playlist.name}</h1>
          <p className="text-sm">{playlist.owner.display_name}</p>
          <p
            className="text-xs break-words w-44 md:w-[19rem] font-light text-slate-200"
            dangerouslySetInnerHTML={{
              __html: playlist.description,
            }}
          ></p>
        </div>
      </div>
      <div
        className="flex flex-col overflow-y-auto h-64 md:h-80"
        ref={ref}
        style={{ scrollBehavior: "smooth" }}
      >
        {playlist.tracks.map((track, index) => (
          <p
            className="border-b border-gray-300 p-2"
            ref={index === firstMatchIndex ? firstMatchRef : null}
          >
            <span className="text-gray-200 font-light mr-2">{index + 1}</span>{" "}
            {track.name} -{" "}
            <span className="text-white font-light">
              {track.artists.map((artist) => artist.name).join(", ")}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
