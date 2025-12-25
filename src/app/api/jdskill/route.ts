import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/jdskill
 * Fetch skills from backend API based on keyword and type
 * @param keyword - Search keyword for skills
 * @param type - Type of skill: 'core' or 'soft'
 */
export async function GET(request: NextRequest) {
  console.log('🌐 [API /api/jdskill] Request received');

  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get("keyword") || ""; // Default to empty string
    const type = searchParams.get("type");

    console.log('🌐 [API /api/jdskill] Params:', { keyword, type });

    // Validate required parameters (allow empty keyword for fetching all)
    if (!type || (type !== "core" && type !== "soft")) {
      return NextResponse.json(
        { error: "Invalid type parameter. Must be 'core' or 'soft'" },
        { status: 400 }
      );
    }

    // Get access token from cookies for authentication
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No access token found" },
        { status: 401 }
      );
    }

    // Get backend API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Fetch skills from backend
    const backendUrl = `${apiUrl}/api/jdskill?keyword=${encodeURIComponent(keyword)}&type=${type}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch skills" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
