import { motion } from "framer-motion";
import { useState } from "react";
import { ReactComponent as SearchIcon } from "../images/search.svg";

export default function SearchBar({ search }) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      className="md:w-80 w-72 flex items-center space-x-2 bg-green-600 rounded-md pr-2 p-1"
    >
      <input
        className="p-2 outline-0 bg-black w-full overflow-visible"
        type="text"
        placeholder="Search for songs or artists"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (searchTerm) {
              search(searchTerm);
            }
          }
        }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button
        className=" p-2"
        onClick={() => {
          if (searchTerm) {
            search(searchTerm);
          }
        }}
      >
        <SearchIcon className="w-5 h-5 fill-black bg-green-600" />
      </button>
    </motion.div>
  );
}
