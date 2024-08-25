"use server";
import { headers } from "next/headers";
import { client, encoder } from "./printer";
import { revalidatePath } from "next/cache";

let count = 0;

const rateLimit = new Map();

export async function printMessage(prevState: any, data: FormData) {
  const ip = headers().get("x-forwarded-for") || headers().get("x-real-ip");
  const lastRequest = rateLimit.get(ip);
  if (lastRequest && Date.now() - lastRequest < 5000) {
    console.log("Rate limited");
    return {
      body: "Rate limited",
    };
  }

  rateLimit.set(ip, Date.now());
  const message = (data.get("message") || "").slice(0, 50);
  const screenName = (data.get("name") || "").slice(0, 25);

  console.log(message);

  console.log("Printing message", data.get("message"));

  const printedMessage = message;

  const encodedMessage = encoder
    .initialize()
    .bold()
    .invert()
    .text(` ${screenName}:`)
    .invert(false)
    .bold(false)
    .text(` ${printedMessage}`)
    .newline()
    .cut()
    .encode();
  client.write(encodedMessage);
  count++;

  revalidatePath("/chat");
  return {
    body: `Printed message: ${printedMessage}`,
    name: screenName,
  };
}
