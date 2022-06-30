import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Editor from "./pages/Editor/Editor";
import Final from "./pages/Final/Final";

import "./App.css";

function App() {
  const [sourceImage, setSourceImage] = useState("");
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/final" element={<Final src={sourceImage} />} />
          <Route
            path="/"
            element={<Editor onFinalize={(src) => setSourceImage(src)} />}
          />
          <Route
            path="/*"
            element={
              <div>
                <h1 style={{ margin: "30px", textAlign: "center" }}>
                  Page not found
                </h1>
              </div>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
