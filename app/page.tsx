import { ContactStrip } from "@/components/home/ContactStrip";
import { Hero } from "@/components/home/Hero";
import { ManifestoStrip } from "@/components/home/ManifestoStrip";
import { PeopleStrip } from "@/components/home/PeopleStrip";
import { ProjectsStrip } from "@/components/home/ProjectsStrip";
import { ResearchStrip } from "@/components/home/ResearchStrip";
import { StatusStrip } from "@/components/home/StatusStrip";

export default function HomePage() {
  return (
    <>
      <StatusStrip />
      <Hero />
      <ManifestoStrip />
      <ProjectsStrip />
      <ResearchStrip />
      <PeopleStrip />
      <ContactStrip />
    </>
  );
}
