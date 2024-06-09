import { fetch_, timeoutPromise } from "../helper";

// -2: neutral    -1: fail    0: processing   1: success
export type ValidationResponse = { result: number; code?: string };

export async function validateName(name: string): Promise<ValidationResponse> {
  const name_ = name.trim();
  if (name_.length === 0) return { result: -1, code: "UNM" };
  if (name_.length < 3) return { result: -1, code: "UNS" };
  return { result: 1 };
}

export async function setName({
  name,
}: {
  name?: string;
}): Promise<ValidationResponse> {
  if (typeof name === "undefined") return { result: -1, code: "UNM" };

  // await timeoutPromise(1);
  const resp = await fetch_("/register/add_username", {
    method: "POST",
    body: name,
    headers: { "Content-Type": "text/plain" },
  });
  const result: { result: boolean; code?: string } = await resp.json();
  return { result: result.result ? 1 : -1, code: result.code };
}
