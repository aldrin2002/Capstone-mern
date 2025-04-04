/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
	  extend: {
		colors: {
		  primary: {
			100: '#FFE4F3',
			200: '#FFB8E6',
			300: '#FF8CD9',
			400: '#FF60CC',
			500: '#FF34BF',
			600: '#FF08B2',
			700: '#CC068E',
			800: '#99046B',
			900: '#660347'
		  }
		},
		animation: {
		  'meteor': 'meteor 1.5s linear infinite',
		  'meteor-slow': 'meteor 2s linear infinite',
		},
		keyframes: {
		  meteor: {
			'0%': { 
			  transform: 'rotate(-45deg) translateX(0)',
			  opacity: 1 
			},
			'100%': { 
			  transform: 'rotate(-45deg) translateX(-200vh)',
			  opacity: 0 
			},
		  }
		}
	  },
	},
	plugins: [],
  };