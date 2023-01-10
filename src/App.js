import React, { useState } from "react";
import {
  Header,
  Footer,
  Footer2,
  About,
  Testimonial,
  Skills,
  Work,
} from "./container";
import { Navbar } from "./components";
import "./App.scss";

function App() {
  return (
    <div className="app">
      <Navbar />
      <Header />
      <About />
      <Work />
      <Skills />
      <Footer />
      <Footer2 />
    </div>
  );
}

export default App;
