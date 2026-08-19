import { ContactStrip } from "@/components/home/ContactStrip";
import { EvidenceStrip } from "@/components/home/EvidenceStrip";
import { Hero } from "@/components/home/Hero";
import { ManifestoStrip } from "@/components/home/ManifestoStrip";
import { PeopleStrip } from "@/components/home/PeopleStrip";
import { ProjectsStrip } from "@/components/home/ProjectsStrip";
import { StatusStrip } from "@/components/home/StatusStrip";
import { SurfacesStrip } from "@/components/home/SurfacesStrip";

export default function HomePage() {
  return (
    <>
      <StatusStrip />
      <Hero />
      <ManifestoStrip />
      <ProjectsStrip />
      <SurfacesStrip />
      <EvidenceStrip />
      <PeopleStrip />
      <ContactStrip />
    </>
  );
}
