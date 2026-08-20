import { ContactStrip } from "@/components/home/ContactStrip";
import { CredentialsStrip } from "@/components/home/CredentialsStrip";
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
      {/* Demos sit directly under the hero. They are the thing worth seeing
          first and they used to sit fourth, below two strips of prose. */}
      <ProjectsStrip />
      <EvidenceStrip />
      <CredentialsStrip />
      <ManifestoStrip />
      <SurfacesStrip />
      <PeopleStrip />
      <ContactStrip />
    </>
  );
}
