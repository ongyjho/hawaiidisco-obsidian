declare module "sql.js" {
	type SqlValue = string | number | null | Uint8Array;
	type ParamArray = SqlValue[];
	type RowObject = Record<string, SqlValue>;

	interface SqlJsStatic {
		Database: new (data?: ArrayLike<number>) => Database;
	}

	interface Database {
		run(sql: string, params?: ParamArray): Database;
		exec(sql: string, params?: ParamArray): QueryExecResult[];
		prepare(sql: string): Statement;
		close(): void;
	}

	interface Statement {
		bind(params?: ParamArray): boolean;
		step(): boolean;
		getAsObject(params?: ParamArray): RowObject;
		free(): boolean;
	}

	interface QueryExecResult {
		columns: string[];
		values: SqlValue[][];
	}

	interface InitSqlJsOptions {
		locateFile?: (file: string) => string;
		wasmBinary?: ArrayBuffer;
	}

	export default function initSqlJs(
		options?: InitSqlJsOptions,
	): Promise<SqlJsStatic>;

	export type { Database, Statement, SqlJsStatic };
}
