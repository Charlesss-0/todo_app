/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			boxShadow: {
				md: '0 1px 5px 0 #0003',
			},
		},
	},
	plugins: [],
}
