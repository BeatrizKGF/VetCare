import { createFileRoute } from "@tanstack/react-router";

import { ManagementDashboard } from "@/components/management-dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de Gestão — VetCare" },
      {
        name: "description",
        content:
          "Indicadores da clínica: faturamento, atendimentos, ticket médio, ocupação da agenda, gráficos e alertas de gestão.",
      },
      { property: "og:title", content: "Dashboard de Gestão — VetCare" },
      {
        property: "og:description",
        content: "Análise financeira, serviços mais procurados e alertas de vacinas e estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagementDashboard,
});
