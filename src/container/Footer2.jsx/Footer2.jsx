import React from "react";
import { BsTwitter, BsInstagram, BsGithub, BsImages } from "react-icons/bs";
import { FaFacebookF } from "react-icons/fa";
import "./Footer2.css";

const Footer2 = () => {
  return (
    <section id="footer2" className="footer">
      <div className="social">
        <a href="https://twitter.com/AsadSha50897093" target="_blank">
          <BsTwitter />
        </a>
        <a href="https://github.com/Asad1024" target="_blank">
          <BsGithub />
        </a>
        <a href="https://www.instagram.com/asad.ali.sh/" target="_blank">
          <BsInstagram />
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=100017577317137"
          target="_blank"
        >
          <FaFacebookF />
        </a>
      </div>
      <ul className="list">
        <li>
          <a href="#home">Home</a>
        </li>

        <li>
          <a href="#about">About</a>
        </li>
        <li>
          <a href="#work">Work</a>
        </li>
        <li>
          <a href="#skills">Skills</a>
        </li>
        <li>
          <a href="#contact">Contact</a>
        </li>
      </ul>
      <p className="copy">@2022 ASAD</p>
      <p className="copy">All rights reserved</p>
    </section>
  );
};

export default Footer2;
