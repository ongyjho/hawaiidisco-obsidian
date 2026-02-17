declare module "sql.js" {
	interface SqlJsStatic {
		Database: new (data?: ArrayLike<number>) => Database;
	}

	interface Database {
		run(sql: string, params?: any[]): Database;
		exec(sql: string, params?: any[]): QueryExecResult[];
		prepare(sql: string): Statement;
		close(): void;
	}

	interface Statement {
		bind(params?: any[]): boolean;
		step(): boolean;
		getAsObject(params?: any): Record<string, any>;
		free(): boolean;
	}

	interface QueryExecResult {
		columns: string[];
		values: any[][];
	}

	interface InitSqlJsOptions {
		locateFile?: (file: string) => string;
	}

	export default function initSqlJs(
		options?: InitSqlJsOptions,
	): Promise<SqlJsStatic>;

	export type { Database, Statement, SqlJsStatic };
}
