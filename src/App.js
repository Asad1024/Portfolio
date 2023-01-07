import React from "react";
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
import NavbarBottom from "./components/nav2/nav2.jsx";
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
      <NavbarBottom />
    </div>
  );
}

export default App;
