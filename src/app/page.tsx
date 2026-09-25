import { Hero } from "@/components/hero";
import { Work } from "@/components/work";
import { Capabilities } from "@/components/capabilities";
import { Experience } from "@/components/experience";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Voyage } from "@/components/space/voyage";

export default function Home() {
  return (
    <>
      <Voyage />
      <Hero />
      <Work />
      <Capabilities />
      <Experience />
      <About />
      <Contact />
    </>
  );
}
