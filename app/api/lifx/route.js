import { NextResponse } from "next/server";

const COLORS = {
  boy:  "hue:225 saturation:0.92 brightness:1.0 kelvin:3500",
  girl: "hue:310 saturation:0.48 brightness:1.0 kelvin:3500",
  default: "hue:174 saturation:0.7 brightness:1.0 kelvin:3500"
};

export async function POST(req) {
  const { gender } = await req.json();
  const color = COLORS[gender?.trim().toLowerCase()] || COLORS.default;
  if (!color) {
    return NextResponse.json({ error: "invalid_gender" }, { status: 400 });
  }

  const res = await fetch("https://api.lifx.com/v1/lights/all/state", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${process.env.LIFX_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ color, power: "on", duration: 0.5 }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
