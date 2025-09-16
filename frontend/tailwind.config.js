/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins-Regular'],
        'poppins-bold': ['Poppins-Bold'],
        'poppins-semibold': ['Poppins-SemiBold'],
        'poppins-medium': ['Poppins-Medium'],
        'poppins-light': ['Poppins-Light'],
        'poppins-thin': ['Poppins-Thin'],
        'poppins-extralight': ['Poppins-ExtraLight'],
        'poppins-extrabold': ['Poppins-ExtraBold'],
        'poppins-black': ['Poppins-Black'],
      },
    },
  },
  plugins: [],
}