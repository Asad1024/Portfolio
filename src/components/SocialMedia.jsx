import React from "react";
import { BsTwitter, BsInstagram, BsGithub } from "react-icons/bs";
import { FaFacebookF } from "react-icons/fa";

const SocialMedia = () => {
  return (
    <div className="app__social">
      <div>
        <a href="https://twitter.com/AsadSha50897093" target="_blank">
          <BsTwitter />
        </a>
      </div>
      <div>
        <a href="https://github.com/Asad1024" target="_blank">
          {" "}
          <BsGithub />
        </a>
      </div>
      <div>
        <a href="https://www.instagram.com/asad.ali.sh/" target="_blank">
          <BsInstagram />
        </a>
      </div>
    </div>
  );
};

export default SocialMedia;
