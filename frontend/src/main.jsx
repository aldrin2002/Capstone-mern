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
		const hadController = !!navigator.serviceWorker.controller;
		navigator.serviceWorker
			.register("/service-worker.js")
			.then((registration) => {
				console.log("Service Worker registered: ", registration);
				// Listen for new service worker found
				registration.addEventListener("updatefound", () => {
					const newWorker = registration.installing;
					if (!newWorker) return;
					newWorker.addEventListener("statechange", () => {
						if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
							console.log("New version installed. Reloading to update...");
							window.location.reload();
						}
					});
				});
			})
			.catch((error) => {
				console.log("Service Worker registration failed: ", error);
			});
		// Listen for activation broadcast from service worker
		navigator.serviceWorker.addEventListener("message", (event) => {
			if (event.data?.type === "SW_ACTIVATED") {
				// Only reload automatically if this was an update (not first install)
				if (hadController) {
					console.log("Service worker activated (update). Reloading page...");
					window.location.reload();
				} else {
					console.log("Service worker activated (first install). Version:", event.data.version);
				}
			}
		});
	});
}