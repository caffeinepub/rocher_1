import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    appendToValue(key: string, newEntry: string): Promise<boolean>;
    getValue(key: string): Promise<string>;
    setValue(key: string, value: string, password: string): Promise<boolean>;
}
