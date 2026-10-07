# YouScan Campaign Dashboard

A TypeScript monorepo for viewing campaign data from CSV and Excel files. The API parses and stores source tables in PostgreSQL, exposes dataset and widget endpoints, and generates randomized data for charts created in the UI. The React dashboard displays the imported sources and lets users create, edit, and delete widgets.

## Project Structure

- `apps/api` — Fastify API, Drizzle schema/migrations, CSV/XLSX parsers, and seed command.
- `apps/web` — React dashboard built with Vite and Recharts.
- `packages/shared` — Shared Zod schemas and widget/source types.
- `apps/api/data` — CSV and XLSX files used by the seed command.

## Requirements

- Node.js 20 or later
- npm
- A PostgreSQL database. Neon is used for the deployed application.

Install dependencies from the repository root:

```sh
npm install
```

## Local Development

Provide `DATABASE_URL` to the API. For a local Neon development environment, pull the API project's Development variables from its project directory:

```sh
cd apps/api
vercel link
vercel env pull .env.development.local
```

From the repository root, start the API with the pulled development variables (Node 20.6+):

```sh
node --env-file=apps/api/.env.development.local --import tsx apps/api/src/server.ts
```

In a second terminal, start the web application:

```sh
npm run dev -w @ys-dashboard/web
```

Open <http://localhost:5173>. Vite proxies `/api` requests to the Fastify API at `http://127.0.0.1:3000`.

Alternatively, configure `DATABASE_URL` in the shell and run the API workspace script with `npm run dev -w @ys-dashboard/api`. The API listens on port `3000` by default; `PORT` and `HOST` can override it.

## Database and Seed Data

Apply the Drizzle migrations:

```sh
npm run db:migrate
```

Import `.csv` and `.xlsx` files from `apps/api/data`:

```sh
npm run db:seed -w @ys-dashboard/api
```

To import additional files by path, run the importer from `apps/api`. Paths may be absolute or relative to that directory; pass one or more files:

```sh
cd apps/api
node --env-file=.env.development.local --import tsx src/import.ts ./data/new-campaign.csv ./data/another-workbook.xlsx
```

This uses the `db:import` script's underlying CLI while loading the pulled development environment. If `DATABASE_URL` is already set in the shell, you can instead run `npm run db:import -- ./data/new-campaign.csv ./data/another-workbook.xlsx`. The command imports CSV files as one table and every non-empty worksheet in each XLSX workbook. It prints the inserted/updated action and parsed dimensions for each table. Re-importing a file with the same basename updates the matching dataset rows and metadata in place, preserving its dataset ID and widget links. Only `.csv` and `.xlsx` extensions are supported.

Seeding is repeatable. Existing datasets are matched by source filename and worksheet name; stale source-kind metadata is corrected. For each imported dataset without an existing widget, the seed creates a default chart: line for a line-named worksheet, pie for a pie-named worksheet, stacked bar for CSV, and bar for other worksheets. Existing widgets are preserved.

The checked-in sample inputs produce these datasets:

- `line-and-pie.xlsx`: a line worksheet with 212 data rows and a pie worksheet with 5 data rows.
- `stacked-bar.csv`: 5 data rows.

## CSV and Excel Parsers

Parser functions are in `apps/api/src/imports/parser.ts`:

```ts
import {
  parseCsvBuffer,
  parseTabularFile,
  parseXlsxBuffer,
  parseXlsxSheetsBuffer,
} from "./imports/parser.js";

const csvTable = parseCsvBuffer(csvBuffer);
const firstSheet = await parseXlsxBuffer(xlsxBuffer);
const allSheets = await parseXlsxSheetsBuffer(xlsxBuffer);
const tableByExtension = await parseTabularFile(filename, buffer);
```

`ParsedTable` has `sheetName`, `columns`, and `rows`. CSV parsing supports quoted fields, skips empty rows, and casts numeric-looking values to numbers. XLSX parsing skips empty worksheets and rows, uses populated column counts, preserves worksheet names, converts dates to ISO strings, and reads formula results when available. The seed command uses `parseXlsxSheetsBuffer` so every non-empty worksheet is imported. `parseTabularFile` accepts `.csv` and `.xlsx`; other extensions are rejected.

Chart-column inference is provided by `inferChartConfig`. It recognizes common named fields such as Campaign, Date, Result, and category/value columns, and supports long-form line and wide-form stacked-bar data.

To add a file format, implement a buffer parser returning `ParsedTable`, route its extension in `parseTabularFile`, and update the seed source-kind handling and parser tests. Keep format-specific parsing in the imports module.

## API

- `GET /health` — health check.
- `GET /api/datasets` — dataset summaries and columns, without row data.
- `GET /api/widgets` — ordered widget list.
- `GET /api/widgets/:id` — widget with chart/text payload.
- `POST /api/widgets` — create a text widget or a chart with newly generated randomized data.
- `PATCH /api/widgets/:id` — update a title, text content, chart mapping, or dataset selection.
- `DELETE /api/widgets/:id` — delete a widget.

Chart generation and imported-file parsing are separate: creating a chart generates a new `generated` dataset; users can switch that chart to an imported dataset from its dataset selector.

## Quality Checks

Run from the repository root:

```sh
npm run typecheck
npm test
npm run build
```

API parser and route tests use Vitest and Fastify `inject()`.

## Vercel Deployment

Deploy the web and API as separate Vercel projects from the same Git repository.

### Web project

- Root Directory: `apps/web`
- Framework: Vite (auto-detected)
- Build/output overrides: leave empty
- Environment variable: `VITE_API_URL=https://<api-deployment>.vercel.app`

### API project

- Root Directory: `apps/api`
- Enable access to files outside the root directory so the workspace lockfile and `packages/shared` are available.
- Framework: Fastify (auto-detected). Leave build/output overrides empty.
- Environment variables:
  - `DATABASE_URL` — Neon PostgreSQL connection string
  - `WEB_ORIGIN` — web deployment origin, including scheme, e.g. `https://<web-deployment>.vercel.app`

The API CORS configuration allows `GET`, `HEAD`, `POST`, `PATCH`, `DELETE`, and `OPTIONS` from `WEB_ORIGIN`. The API and web build scripts build the shared workspace package before compiling.

Run `npm run db:migrate` once for a new Production database, then run `npm run db:seed -w @ys-dashboard/api` when the production sample datasets and default widgets should be created. Vercel Functions still have execution-time, request-size, and bundle-size limits; enforce upload limits when adding file-upload routes.
