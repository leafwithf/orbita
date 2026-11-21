import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ÓRBITA — suas ideias, projetos e tarefas",
    short_name: "ÓRBITA",
    description:
      "Um foco por vez: projetos, tarefas, cursos e arquivos em um só lugar. Sem jargão, sem ruído.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "pt-BR",
    dir: "ltr",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    categories: ["productivity", "education", "organization"],
    icons: [
      {
        src: "/icons/orbita.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nova tarefa",
        short_name: "Tarefa",
        description: "Criar uma tarefa rapidamente",
        url: "/criar?tipo=tarefa",
        icons: [
          {
            src: "/icons/orbita.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      {
        name: "Registrar ideia",
        short_name: "Ideia",
        description: "Guardar uma ideia no backlog",
        url: "/criar?tipo=ideia",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
