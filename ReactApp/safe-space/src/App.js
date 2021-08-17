import React from "react";
import "./App.css";
import Container3D from "./components3D/Container3D/Container3D";
import VideoContainer from "./componentsUI/VideoContainer/VideoContainer";


export default function App() {
  return (
    <div>
      <Container3D />
      <VideoContainer />
    </div>
  );
}