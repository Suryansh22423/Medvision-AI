import { createFileRoute } from "@tanstack/react-router";
import { AnalysisWorkbench } from "@/components/analysis-workbench";

export const Route = createFileRoute("/dashboard/bone")({
  head: () => ({
    meta: [
      { title: "Bone Fracture Analysis — MedVision AI" },
      {
        name: "description",
        content:
          "Upload a bone radiograph for AI fracture typing and localization across 11 skeletal regions.",
      },
      { property: "og:title", content: "Bone Fracture Analysis — MedVision AI" },
      {
        property: "og:description",
        content: "Fracture detection, typing and localization with structured preliminary reports.",
      },
    ],
  }),
  component: () => <AnalysisWorkbench type="bone" />,
});
