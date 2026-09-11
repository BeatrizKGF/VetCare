import { createFileRoute } from "@tanstack/react-router";

import { HomeDashboard } from "@/components/home-dashboard";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Página Inicial — VetCare" },
      {
        name: "description",
        content:
          "Portal de boas-vindas do VetCare: ações rápidas, atendimentos do dia e o resumo da clínica veterinária.",
      },
      { property: "og:title", content: "Página Inicial — VetCare" },
      {
        property: "og:description",
        content: "Comece o dia com tudo à mão: agenda, pacientes, tutores e alertas de estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeDashboard,
});
