export interface Tab {
    name: string;
    title: string;
    selected?: boolean;
    // this will always be a substring.
    route: string;
    rules?: () => boolean
}