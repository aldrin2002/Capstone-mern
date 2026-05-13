/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
	  extend: {
		colors: {
		  brand: '#F13E93',
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
		  },
		  brown: {
			600: '#7d5d4f',
			700: '#6b4c3e',
			800: '#5a3d2f',
			900: '#483225'
		  },
		  cream: {
			100: '#e8e0d5',
			200: '#d8cfc2',
			300: '#c8beaf'
		  }
		},
		animation: {
		  'meteor': 'meteor 1.5s linear infinite',
		  'meteor-slow': 'meteor 2s linear infinite',
		  'fadeIn': 'fadeIn 0.3s ease-in-out',
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
		  },
		  fadeIn: {
			'0%': { opacity: 0 },
			'100%': { opacity: 1 }
		  }
		}
	  },
	},
	plugins: [],
  };