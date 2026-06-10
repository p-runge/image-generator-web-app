import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL;
const API_SECRET = process.env.API_SECRET;

export async function POST(req: NextRequest) {
  if (!PYTHON_API_URL) {
    return NextResponse.json(
      { error: "PYTHON_API_URL is not configured" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (API_SECRET && authHeader !== `Bearer ${API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${PYTHON_API_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Python server" },
      { status: 502 },
    );
  }

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.detail ?? "Generation failed" },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}
