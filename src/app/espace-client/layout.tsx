import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "Espace client", template: "%s · Espace client" },
  robots: { index: false, follow: false },
};

export default function EspaceClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-toile py-10 sm:py-14">
      <Container>{children}</Container>
    </section>
  );
}
