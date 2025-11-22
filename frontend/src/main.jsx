import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>,
);

// Register service worker for PWA
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/service-worker.js")
			.then((registration) => {
				console.log("Service Worker registered: ", registration);
				// Listen for messages from SW (version activation)
				navigator.serviceWorker.addEventListener("message", (event) => {
					if (event.data?.type === "SW_ACTIVE") {
						console.log("CafeX SW active version:", event.data.version);
					}
				});

				// Optional: handle controllerchange (when a new SW takes control)
				navigator.serviceWorker.addEventListener("controllerchange", () => {
					console.log("New service worker controlling page.");
				});
			})
			.catch((error) => {
				console.log("Service Worker registration failed: ", error);
			});
	});
}