import SearchBar from "./SearchBar";
import { motion } from "framer-motion";

export default function Header({ context }) {
  return (
    <div className="flex flex-col space-y-4 items-center">
      <h1 className=" text-center text-xl lg:text-3xl font-semibold">
        Spotify Playlist Search Tool
      </h1>
      <p>Hello {context.userProfile?.display_name.split(" ")[0]}</p>
      <img
        className="rounded-full"
        src={context.userProfile?.images[0]?.url}
        width={150}
        height={150}
        alt="User's spotify profile"
      ></img>
      <SearchBar search={context.search} />
      {context.searchResults.length > 0 && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={
            "rounded-full text-black text-xl bg-green-600 w-12 h-12 md:w-20 md:h-20  text-center fixed transition-all bottom-2 md:bottom-4 right-2 md:right-28 opacity-80 hover:opacity-100 focus:opacity-100 " +
            (!context.showScrollToTop && "-bottom-24 md:-bottom-24")
          }
        >
          <svg className={"w-12 h-12 md:w-20 md:h-20"} viewBox="0 0 100 100">
            <polygon
              points="47,75 47,50 38,50 50,28 62,50 53,50 53,75"
              fill="black"
              stroke="black"
            />
          </svg>
        </motion.button>
      )}
      {context.errMsg && <p className="text-red-600">{context.errMsg}</p>}
      {context.isLoadingPlaylists && (
        <p>
          Loading your playlists
          <span className="w-2 inline-block">{context.dots}</span>{" "}
          {context.userPlaylists.length} / {context.totalPlaylists} <br />
          <span className="text-xs -mt-1">
            (You can search just the loaded ones)
          </span>
        </p>
      )}
      {!context.isLoadingPlaylists && (
        <p>Loaded {context.userPlaylists.length} playlists</p>
      )}

      {context.searchedTerm && (
        <p>
          {context.searchResults.length} matching out of{" "}
          {context.totalPlaylists} total playlists
        </p>
      )}
      {context.searchedTerm && context.searchResults.length === 0 && (
        <p>No results found</p>
      )}
    </div>
  );
}
