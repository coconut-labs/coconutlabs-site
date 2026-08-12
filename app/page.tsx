import { ContactStrip } from "@/components/home/ContactStrip";
import { DotField } from "@/components/home/DotField";
import { Hero } from "@/components/home/Hero";
import { ManifestoStrip } from "@/components/home/ManifestoStrip";
import { PeopleStrip } from "@/components/home/PeopleStrip";
import { ProjectsStrip } from "@/components/home/ProjectsStrip";
import { ResearchStrip } from "@/components/home/ResearchStrip";
import { StatusStrip } from "@/components/home/StatusStrip";

export default function HomePage() {
  return (
    <>
      {/* The dot-field ground runs under the whole page; bands and cards
          paint over it. See design-system SS5 (named background exception). */}
      <DotField />
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
