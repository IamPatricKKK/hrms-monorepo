// DataSource cho TypeORM CLI (migration:generate / migration:run / migration:revert).
//   pnpm --filter @hrms/api typeorm migration:run
import "reflect-metadata";
import { DataSource } from "typeorm";
import { ALL_ENTITIES, MIGRATIONS_GLOB, pgConnectionOptions } from "./data-source";

export default new DataSource({
  ...pgConnectionOptions(),
  entities: ALL_ENTITIES,
  migrations: [MIGRATIONS_GLOB],
  synchronize: false,
});
