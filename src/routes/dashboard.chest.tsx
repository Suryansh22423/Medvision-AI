import { createFileRoute } from "@tanstack/react-router";
import { AnalysisWorkbench } from "@/components/analysis-workbench";

export const Route = createFileRoute("/dashboard/chest")({
  head: () => ({
    meta: [
      { title: "Chest X-ray Analysis — MedVision AI" },
      {
        name: "description",
        content:
          "Upload a chest radiograph for AI screening across pneumonia, tuberculosis, pneumothorax, cardiomegaly and more.",
      },
      { property: "og:title", content: "Chest X-ray Analysis — MedVision AI" },
      {
        property: "og:description",
        content: "Multi-disease chest X-ray screening with confidence scoring and preliminary reports.",
      },
    ],
  }),
  component: () => <AnalysisWorkbench type="chest" />,
});
