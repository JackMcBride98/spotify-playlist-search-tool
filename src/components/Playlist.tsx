import { useEffect, useRef, useState } from "react";

export default function Playlist({ playlist, searchedTerm }) {
  const ref = useRef(null);
  const firstMatchRef = useRef(null);
  const [firstMatchIndex, setFirstMatchIndex] = useState(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollBehaviour = "auto";
      ref.current.scrollTop = 0;
      const firstMatch = playlist?.tracks?.find(
        (track) =>
          track?.name?.toUpperCase().includes(searchedTerm.toUpperCase()) ||
          track?.artists?.some((artist) =>
            artist?.name?.toUpperCase().includes(searchedTerm.toUpperCase())
          )
      );
      setFirstMatchIndex(playlist?.tracks?.indexOf(firstMatch));
      let timer1 = setTimeout(() => {
        ref.current.scrollBehaviour = "smooth";
        ref.current.scrollTop =
          firstMatchRef.current.offsetTop - ref.current.offsetTop;
      }, 500);
      return () => clearTimeout(timer1);
    }
  }, [searchedTerm, playlist.tracks]);

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
          <h1 className="text-lg">{playlist?.name}</h1>
          <p className="text-sm">{playlist?.owner.display_name}</p>
          <a
            href={`spotify:playlist:${playlist.id}`}
            rel="noreferrer"
            target="_blank"
            className="text-base text-green-300 hover:italic"
          >
            Link
          </a>
          <p
            className="text-xs break-words w-44 md:w-[19rem] font-light text-slate-200 mb-2"
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
        {playlist.tracks.map((track, index) => {
          const isMatch =
            track?.name?.toUpperCase().includes(searchedTerm.toUpperCase()) ||
            track?.artists?.some((artist) =>
              artist?.name?.toUpperCase().includes(searchedTerm.toUpperCase())
            );
          return (
            <p
              className={
                "border-b border-gray-300 p-2 " +
                (isMatch
                  ? "bg-gradient-to-r from-green-600/80 via-black  to-green-600/80 "
                  : "")
              }
              key={track.id + index.toString()}
              ref={index === firstMatchIndex ? firstMatchRef : null}
            >
              <span className="text-gray-200 font-light mr-2">{index + 1}</span>{" "}
              {track?.name} -{" "}
              <span className="text-white font-light">
                {track?.artists?.map((artist) => artist.name).join(", ")}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
