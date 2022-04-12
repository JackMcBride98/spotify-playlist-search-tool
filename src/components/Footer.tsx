import { motion } from "framer-motion";

export default function Footer({ context }) {
  return (
    <div className="flex flex-col space-y-4 items-center mt-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="text-center p-4 border rounded-md"
        onClick={() => {
          context.setAccessToken("");
          window.location.href = "/";
        }}
      >
        Logout
      </motion.button>
    </div>
  );
}
