import { Hero } from "@/components/hero";
import { Work } from "@/components/work";
import { Capabilities } from "@/components/capabilities";
import { Skills } from "@/components/skills";
import { Experience } from "@/components/experience";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Work />
      <Capabilities />
      <Skills />
      <Experience />
      <About />
      <Contact />
    </>
  );
}
