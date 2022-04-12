import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LoginPage({ login, errMsg }) {
  const [showSecretSVG, setShowSecretSVG] = useState(false);
  const [logoClicked, setLogoClicked] = useState(false);

  useEffect(() => {
    let timer1 = setTimeout(() => setLogoClicked(true), 250);
    let timer2 = setTimeout(() => setLogoClicked(false), 1050);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <>
      <h1 className=" text-center text-xl lg:text-3xl font-semibold">
        Spotify Playlist Search Tool
      </h1>
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
      {errMsg && <p className="text-red-600">{errMsg}</p>}
      <button
        className="ml-16 text-center text-black p-4 rounded-md cursor-default"
        onClick={() => {
          setShowSecretSVG(!showSecretSVG);
          setTimeout(
            () =>
              document.scrollingElement.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
              }),
            10
          );

          setTimeout(() => {
            setShowSecretSVG(false);
            document.scrollingElement.scrollIntoView();
          }, 3000);
        }}
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
        <line x1="10" x2="90" y1="15" y2="15" stroke="black" strokeWidth="10" />
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
        <path d="M10 10 H 90 V 90 H 10 Z " stroke="red" fill="transparent" />
        <path d="M 10 10 C 20 20, 40 20, 50 10" stroke="purple" />
      </svg>
    </>
  );
}
