/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

/////////////////////////////////////////
// Requires pg-promise v8.7.0 or later.
/////////////////////////////////////////

import * as XPromise from './ext-promise'; // External Promise Provider

import * as pg from './pg-subset';
import * as pgMinify from 'pg-minify';
import * as spexLib from 'spex';

// Empty Extensions
interface IEmptyExt {

}

// Main protocol of the library;
// API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
declare namespace pgPromise {

    type TQueryFileOptions = {
        debug?: boolean
        minify?: boolean | 'after'
        compress?: boolean
        params?: any
        noWarnings?: boolean
    };

    type TFormattingOptions = {
        partial?: boolean
        def?: any
    };

    interface ILostContext {
        cn: string
        dc: any
        start: Date
        client: pg.Client
    }

    type TConnectionOptions = {
        direct?: boolean
        onLost?: (err?: any, e?: ILostContext) => void
    };

    type TAssignOptions = {
        source?: object
        prefix?: string
    };

    type TAssignColumnsOptions = {
        from?: string
        to?: string
        skip?: string | string[] | ((c: Column) => boolean)
    };

    type TPreparedBasic = {
        name: string
        text: string
        values: any[]
        binary: boolean
        rowMode: string
        rows: number
    };

    type TParameterizedBasic = {
        text: string
        values: any[]
        binary: boolean
        rowMode: string
    };

    type TPrepared = {
        name: string
        text: string | QueryFile
        values?: any[]
        binary?: boolean
        rowMode?: string
        rows?: number
    };

    type TParameterized = {
        text: string | QueryFile
        values?: any[]
        binary?: boolean
        rowMode?: string
    };

    type TVirtualQuery = (values?: any) => TQuery

    type TQuery =
        string
        | QueryFile
        | TPrepared
        | TParameterized
        | PreparedStatement
        | ParameterizedQuery
        | TVirtualQuery

    type TColumnDescriptor = {
        source: any
        name: string
        value: any
        exists: boolean
    };

    type TColumnConfig = {
        name: string
        prop?: string
        mod?: string
        cast?: string
        cnd?: boolean
        def?: any
        init?: (col: TColumnDescriptor) => any
        skip?: (col: TColumnDescriptor) => boolean
    };

    type TColumnSetOptions = {
        table?: string | TTable | TableName
        inherit?: boolean
    };

    type TUpdateOptions = {
        tableAlias?: string
        valueAlias?: string
        emptyUpdate?: any
    };

    type TTable = {
        table: string
        schema?: string
    };

    type TQueryColumns = Column | ColumnSet | Array<string | TColumnConfig | Column>

    type TSqlBuildConfig = {
        dir: string
        recursive?: boolean
        ignoreErrors?: boolean
        output?: string
        module?: {
            path?: string
            name?: string
        }
    };

    type TQueryFormat = {
        query: string | QueryFile
        values?: any
        options?: TFormattingOptions
    };

    type TPromiseConfig = {
        create: (resolve: (value?: any) => void, reject?: (reason?: any) => void) => XPromise<any>

        resolve: (value?: any) => void

        reject: (reason?: any) => void

        all: (iterable: any) => XPromise<any>
    };

    // helpers.TableName class;
    // API: http://vitaly-t.github.io/pg-promise/helpers.TableName.html
    class TableName {
        constructor(table: string, schema?: string)
        constructor(table: TTable)

        // these are all read-only:
        readonly name: string;
        readonly table: string;
        readonly schema: string;

        toString(): string

        toPostgres(self: TableName): string
    }

    // helpers.Column class;
    // API: http://vitaly-t.github.io/pg-promise/helpers.Column.html
    class Column {
        constructor(col: string | TColumnConfig);

        // these are all read-only:
        readonly name: string;
        readonly prop: string;
        readonly mod: string;
        readonly cast: string;
        readonly cnd: boolean;
        readonly def: any;
        readonly castText: string;
        readonly escapedName: string;
        readonly init: (value: any) => any;
        readonly skip: (name: string) => boolean;

        toString(level?: number): string
    }

    // helpers.Column class;
    // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html
    class ColumnSet {
        constructor(columns: Column, options?: TColumnSetOptions)
        constructor(columns: Array<string | TColumnConfig | Column>, options?: TColumnSetOptions)
        constructor(columns: object, options?: TColumnSetOptions)

        readonly columns: Column[];
        readonly names: string;
        readonly table: TableName;
        readonly variables: string;

        assign(source?: TAssignOptions): string

        assignColumns(options?: TAssignColumnsOptions): string

        extend(columns: Column | ColumnSet | Array<string | TColumnConfig | Column>): ColumnSet

        merge(columns: Column | ColumnSet | Array<string | TColumnConfig | Column>): ColumnSet

        prepare(obj: object): object

        toString(level?: number): string
    }

    const minify: typeof pgMinify;

    // Query Result Mask;
    // API: http://vitaly-t.github.io/pg-promise/global.html#queryResult
    enum queryResult {
        one = 1,
        many = 2,
        none = 4,
        any = 6
    }

    // PreparedStatement class;
    // API: http://vitaly-t.github.io/pg-promise/PreparedStatement.html
    class PreparedStatement {

        constructor(name: string, text: string | QueryFile, values?: any[])
        constructor(obj: PreparedStatement)
        constructor(obj: TPrepared)

        // standard properties:
        name: string;
        text: string | QueryFile;
        values: any[];

        // advanced properties:
        binary: boolean;
        rowMode: string;
        rows: any;

        parse(): TPreparedBasic | errors.PreparedStatementError

        toString(level?: number): string
    }

    // ParameterizedQuery class;
    // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html
    class ParameterizedQuery {

        constructor(text: string | QueryFile, values?: any[])
        constructor(obj: ParameterizedQuery)
        constructor(obj: TParameterized)

        // standard properties:
        text: string | QueryFile;
        values: any[];

        // advanced properties:
        binary: boolean;
        rowMode: string;

        parse(): TParameterizedBasic | errors.ParameterizedQueryError

        toString(level?: number): string
    }

    // QueryFile class;
    // API: http://vitaly-t.github.io/pg-promise/QueryFile.html
    class QueryFile {
        constructor(file: string, options?: TQueryFileOptions)

        readonly error: Error;
        readonly file: string;
        readonly options: any;

        prepare(): void

        toString(level?: number): string

        toPostgres(self: QueryFile): string
    }

    // PromiseAdapter class;
    // API: http://vitaly-t.github.io/pg-promise/PromiseAdapter.html
    class PromiseAdapter {
        constructor(api: TPromiseConfig)
    }

    const txMode: ITXMode;
    const utils: IUtils;
    const as: IFormatting;

    // Database full protocol;
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    //
    // We export this interface only to be able to help IntelliSense cast extension types correctly,
    // which doesn't always work, depending on the version of IntelliSense being used. 
    interface IDatabase<Ext> extends IBaseProtocol<Ext> {
        connect(options?: TConnectionOptions): XPromise<IConnected<Ext>>

        /////////////////////////////////////////////////////////////////////////////
        // Hidden, read-only properties, for integrating with third-party libraries:

        readonly $config: ILibConfig<Ext>
        readonly $cn: string | TConfig
        readonly $dc: any
        readonly $pool: any
    }

    interface IResultExt extends pg.IResult {
        // Property 'duration' exists only in the following context:
        //  - for single-query events 'receive'
        //  - for method Database.result
        duration?: number;
    }

    type TConfig = pg.TConnectionParameters

    // Post-initialization interface;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface IMain {
        <T>(cn: string | TConfig, dc?: any): IDatabase<T> & T

        readonly PromiseAdapter: typeof PromiseAdapter
        readonly PreparedStatement: typeof PreparedStatement
        readonly ParameterizedQuery: typeof ParameterizedQuery
        readonly QueryFile: typeof QueryFile
        readonly queryResult: typeof queryResult
        readonly minify: typeof pgMinify
        readonly spex: spexLib.ISpex
        readonly errors: typeof errors
        readonly utils: IUtils
        readonly txMode: ITXMode
        readonly helpers: IHelpers
        readonly as: IFormatting
        readonly pg: typeof pg

        end(): void
    }

    // Additional methods available inside tasks + transactions;
    // API: http://vitaly-t.github.io/pg-promise/Task.html
    interface ITask<Ext> extends IBaseProtocol<Ext>, spexLib.ISpexBase {
        readonly ctx: ITaskContext
    }

    // Base database protocol
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface IBaseProtocol<Ext> {

        // API: http://vitaly-t.github.io/pg-promise/Database.html#query
        query<T = any>(query: TQuery, values?: any, qrm?: queryResult): XPromise<T>

        // result-specific methods;

        // API: http://vitaly-t.github.io/pg-promise/Database.html#none
        none(query: TQuery, values?: any): XPromise<null>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#one
        one<T = any>(query: TQuery, values?: any, cb?: (value: any) => T, thisArg?: any): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#oneOrNone
        oneOrNone<T = any>(query: TQuery, values?: any, cb?: (value: any) => T, thisArg?: any): XPromise<T | null>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#many
        many<T = any>(query: TQuery, values?: any): XPromise<T[]>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#manyOrNone
        manyOrNone<T = any>(query: TQuery, values?: any): XPromise<T[]>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#any
        any<T = any>(query: TQuery, values?: any): XPromise<T[]>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#result
        result<T = IResultExt>(query: TQuery, values?: any, cb?: (value: IResultExt) => T, thisArg?: any): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#multiResult
        multiResult(query: TQuery, values?: any): XPromise<pg.IResult[]>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#multi
        multi<T = any>(query: TQuery, values?: any): XPromise<Array<T[]>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#stream
        stream(qs: object, init: (stream: NodeJS.ReadableStream) => void): XPromise<{ processed: number, duration: number }>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#func
        func<T = any>(funcName: string, values?: any, qrm?: queryResult): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#proc
        proc<T = any>(procName: string, values?: any, cb?: (value: any) => T, thisArg?: any): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#map
        map<T = any>(query: TQuery, values: any, cb: (row: any, index: number, data: any[]) => T, thisArg?: any): XPromise<T[]>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#each
        each<T = any>(query: TQuery, values: any, cb: (row: any, index: number, data: any[]) => void, thisArg?: any): XPromise<T[]>

        // Tasks;
        // API: http://vitaly-t.github.io/pg-promise/Database.html#task
        task<T = any>(cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        task<T = any>(tag: string | number, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        task<T = any>(options: { tag?: any }, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        // Conditional Tasks;
        // API: http://vitaly-t.github.io/pg-promise/Database.html#taskIf
        taskIf<T = any>(cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        taskIf<T = any>(tag: string | number, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        taskIf<T = any>(options: { tag?: any, cnd?: boolean | ((t: ITask<Ext> & Ext) => boolean) }, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        // Transactions;
        // API: http://vitaly-t.github.io/pg-promise/Database.html#tx
        tx<T = any>(cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        tx<T = any>(tag: string | number, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        tx<T = any>(options: { tag?: any, mode?: TransactionMode }, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        // Conditional Transactions;
        // API: http://vitaly-t.github.io/pg-promise/Database.html#txIf
        txIf<T = any>(cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        txIf<T = any>(tag: string | number, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>

        txIf<T = any>(options: { tag?: any, mode?: TransactionMode, reusable?: boolean | ((t: ITask<Ext> & Ext) => boolean), cnd?: boolean | ((t: ITask<Ext> & Ext) => boolean) }, cb: (t: ITask<Ext> & Ext) => T | XPromise<T>): XPromise<T>
    }

    // Database object in connected state;
    interface IConnected<Ext> extends IBaseProtocol<Ext>, spexLib.ISpexBase {
        readonly client: pg.Client

        done(): void
    }

    // Event context extension for tasks + transactions;
    // See: http://vitaly-t.github.io/pg-promise/global.html#TaskContext
    interface ITaskContext {

        // these are set in the beginning of each task/transaction:
        readonly context: any
        readonly parent: ITaskContext | null
        readonly connected: boolean
        readonly inTransaction: boolean
        readonly level: number
        readonly useCount: number
        readonly isTX: boolean
        readonly start: Date
        readonly tag: any
        readonly dc: any

        // these are set at the end of each task/transaction:
        readonly finish?: Date
        readonly duration?: number
        readonly success?: boolean
        readonly result?: any

        // this exists only inside transactions (isTX = true):
        readonly txLevel?: number
    }

    // Generic Event Context interface;
    // See: http://vitaly-t.github.io/pg-promise/global.html#EventContext
    interface IEventContext {
        client: pg.Client
        cn: any
        dc: any
        query: any
        params: any
        ctx: ITaskContext
    }

    // Errors namespace
    // API: http://vitaly-t.github.io/pg-promise/errors.html
    namespace errors {
        // QueryResultError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.QueryResultError.html
        class QueryResultError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            result: pg.IResult;
            received: number;
            code: queryResultErrorCode;
            query: string;
            values: any;

            // API: http://vitaly-t.github.io/pg-promise/errors.QueryResultError.html#toString
            toString(): string
        }

        // QueryFileError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.QueryFileError.html
        class QueryFileError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            file: string;
            options: TQueryFileOptions;
            error: pgMinify.SQLParsingError;

            toString(level?: number): string
        }

        // PreparedStatementError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.PreparedStatementError.html
        class PreparedStatementError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            error: QueryFileError;

            toString(level?: number): string
        }

        // ParameterizedQueryError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.ParameterizedQueryError.html
        class ParameterizedQueryError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            error: QueryFileError;

            toString(level?: number): string
        }

        // Query Result Error Code;
        // API: http://vitaly-t.github.io/pg-promise/errors.html#.queryResultErrorCode
        enum queryResultErrorCode {
            noData = 0,
            notEmpty = 1,
            multiple = 2
        }
    }

    // Transaction Isolation Level;
    // API: http://vitaly-t.github.io/pg-promise/txMode.html#.isolationLevel
    enum isolationLevel {
        none = 0,
        serializable = 1,
        repeatableRead = 2,
        readCommitted = 3
    }

    // TransactionMode class;
    // API: http://vitaly-t.github.io/pg-promise/txMode.TransactionMode.html
    class TransactionMode {
        constructor(tiLevel?: isolationLevel, readOnly?: boolean, deferrable?: boolean)
        constructor(options: { tiLevel?: isolationLevel, readOnly?: boolean, deferrable?: boolean })

        begin: (cap?: boolean) => string
    }

    type ValidSchema = string | string[] | null | void;

    // Library's Initialization Options
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface IOptions<Ext> {
        noWarnings?: boolean
        pgFormatting?: boolean
        pgNative?: boolean
        promiseLib?: any
        connect?: (client: pg.Client, dc: any, useCount: number) => void
        disconnect?: (client: pg.Client, dc: any) => void
        query?: (e: IEventContext) => void
        receive?: (data: any[], result: IResultExt, e: IEventContext) => void
        task?: (e: IEventContext) => void
        transact?: (e: IEventContext) => void
        error?: (err: any, e: IEventContext) => void
        extend?: (obj: IDatabase<Ext> & Ext, dc: any) => void
        noLocking?: boolean
        capSQL?: boolean
        schema?: ValidSchema | ((dc: any) => ValidSchema)
    }

    // API: http://vitaly-t.github.io/pg-promise/Database.html#$config
    interface ILibConfig<Ext> {
        version: string
        promiseLib: any
        promise: IGenericPromise
        options: IOptions<Ext>
        pgp: IMain
        $npm: any
    }

    // Custom-Type Formatting object
    // API: https://github.com/vitaly-t/pg-promise#custom-type-formatting
    interface ICTFObject {
        toPostgres: (a: any) => any
    }

    interface ICustomTypeFormatting {
        toPostgres: symbol
        rawType: symbol
    }

    // Query formatting namespace;
    // API: http://vitaly-t.github.io/pg-promise/formatting.html
    interface IFormatting {

        ctf: ICustomTypeFormatting,

        alias(name: string | (() => string)): string

        array(arr: any[] | (() => any[])): string

        bool(value: any | (() => any)): string

        buffer(obj: object | (() => object), raw?: boolean): string

        csv(values: any | (() => any)): string

        date(d: Date | (() => Date), raw?: boolean): string

        format(query: string | QueryFile | ICTFObject, values?: any, options?: TFormattingOptions): string

        func(func: (cc: any) => any, raw?: boolean, cc?: any): string

        json(data: any | (() => any), raw?: boolean): string

        name(name: any | (() => any)): string

        number(value: number | (() => number)): string

        text(value: any | (() => any), raw?: boolean): string

        value(value: any | (() => any)): string
    }

    // Transaction Mode namespace;
    // API: http://vitaly-t.github.io/pg-promise/txMode.html
    interface ITXMode {
        isolationLevel: typeof isolationLevel
        TransactionMode: typeof TransactionMode
    }

    interface ITaskArguments<T> extends IArguments {
        options: { tag?: any, cnd?: any, mode?: TransactionMode } & T
        cb: () => any
    }

    // General-purpose functions
    // API: http://vitaly-t.github.io/pg-promise/utils.html
    interface IUtils {
        camelize(text: string): string

        camelizeVar(text: string): string

        objectToCode(obj: any, cb?: (value: any, name: string, obj: any) => any): string

        enumSql(dir: string, options?: { recursive?: boolean, ignoreErrors?: boolean }, cb?: (file: string, name: string, path: string) => any): any

        buildSqlModule(config?: string | TSqlBuildConfig): string

        taskArgs<T = {}>(args: IArguments): ITaskArguments<T>
    }

    // Query Formatting Helpers
    // API: http://vitaly-t.github.io/pg-promise/helpers.html
    interface IHelpers {

        concat(queries: Array<string | TQueryFormat | QueryFile>): string

        insert(data: object | object[], columns?: TQueryColumns, table?: string | TTable | TableName): string

        update(data: object | object[], columns?: TQueryColumns, table?: string | TTable | TableName, options?: TUpdateOptions): any

        values(data: object | object[], columns?: TQueryColumns): string

        sets(data: object, columns?: TQueryColumns): string

        Column: typeof Column
        ColumnSet: typeof ColumnSet
        TableName: typeof TableName
    }

    interface IGenericPromise {
        (cb: (resolve: (value?: any) => void, reject?: (reason?: any) => void) => void): XPromise<any>

        resolve(value?: any): void

        reject(reason?: any): void

        all(iterable: any): XPromise<any>
    }

}

// Default library interface (before initialization)
// API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
declare function pgPromise(options?: pgPromise.IOptions<IEmptyExt>): pgPromise.IMain
declare function pgPromise<Ext>(options?: pgPromise.IOptions<Ext>): pgPromise.IMain

export = pgPromise;
