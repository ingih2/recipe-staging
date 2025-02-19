const jsonBasicPrelude = "data:application/json;base64,";

export function jsonToURI(obj: object): string {
  const jsonString = JSON.stringify(obj);
  // NOTE from someone blissfully unaware (me)
  // I get warnings that btoa is technically deprecated
  // But it seems like the most appropriate function to use in the browser, right?
  return jsonBasicPrelude.concat(btoa(jsonString));
}
