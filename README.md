This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Carpeta `hands/` (herramientas operativas)

Propósito:
La carpeta `hands/` contiene scripts auxiliares seguros y no destructivos para el flujo de trabajo Git y para dejar la base preparada para futuros despliegues controlados.

Scripts disponibles:
- `./hands/git_sync_main.sh` — sincroniza la rama `main` con `origin/main` (fetch + checkout main + pull --ff-only).
- `./hands/git_new_branch.sh <branch>` — crea una nueva rama basada en `main`. Requiere un argumento: el nombre de la nueva rama.
- `./hands/git_commit_push.sh "<mensaje>"` — añade todos los cambios, hace commit con el mensaje provisto y hace push de la rama actual a `origin`.
- `./hands/deploy_eparking.sh` — plantilla base de despliegue. NO ejecuta despliegues; muestra rama actual, último commit, estado git y pasos TODO para build/migrations/restarts/smoke tests.

Flujo recomendado (manual y controlado):
1. `./hands/git_sync_main.sh` — sincronizar main desde remoto.
2. `./hands/git_new_branch.sh feature/mi-cambio` — crear rama de trabajo.
3. Trabajar en la rama, realizar cambios locales.
4. `./hands/git_commit_push.sh "feat: descripción del cambio"` — commit y push de la rama.
5. Abrir Pull Request y completar revisión/CI antes de merge.
6. Merge a `main` y seguir el runbook de despliegue (manual o CI controlado).

Notas de seguridad y buenas prácticas:
- Nunca incluir secretos ni archivos de entorno en el repositorio. Usa `.env.example` como referencia.
- No ejecutar despliegues automáticos desde estos scripts. `deploy_eparking.sh` es solo una plantilla informativa.
- Mantener `main` protegido por políticas de revisión y checks en el futuro.

