const jsonBasicPrelude = "data:application/json;base64,";

export function jsonToURI(obj: object): string {
    const jsonString = JSON.stringify(obj);
    // I guess btoa is technically deprecated but it's "fine" to use in the browser, right?
    return jsonBasicPrelude.concat(btoa(jsonString));
}
