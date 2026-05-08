import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import WidgetApp from "./WidgetApp";
import "./styles.css";

const isWidget = new URLSearchParams(window.location.search).get("mode") === "widget";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isWidget ? <WidgetApp /> : <App />}
  </React.StrictMode>,
);
