import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("include_inactive") === "1";

  let query = supabaseAdmin
    .from("questions")
    .select("*")
    .eq("person_id", personId)
    .order("sort_order");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  const body = await request.json();
  const sectionId = body?.section_id as string | undefined;
  const prompt = (body?.prompt as string | undefined) ?? "New question";
  const type = (body?.type as string | undefined) ?? "checkbox";
  const options = (body?.options as Record<string, unknown> | undefined) ?? {};
  const sortOrder = body?.sort_order as number | undefined;

  if (!sectionId) {
    return NextResponse.json({ error: "section_id required" }, { status: 400 });
  }

  let nextSort = sortOrder;
  if (nextSort === undefined) {
    const { data: latest } = await supabaseAdmin
      .from("questions")
      .select("sort_order")
      .eq("person_id", personId)
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const maxSort = latest?.[0]?.sort_order ?? 0;
    nextSort = maxSort + 1;
  }

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert({
      person_id: personId,
      section_id: sectionId,
      prompt: prompt.trim() || "New question",
      type,
      options,
      sort_order: nextSort
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to create question" }, { status: 500 });
  }

  return NextResponse.json({ question: data });
}

export async function PATCH(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  const body = await request.json();
  const id = body?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.prompt === "string") updates.prompt = body.prompt.trim() || "Untitled question";
  if (typeof body.type === "string") updates.type = body.type;
  if (body.options !== undefined) updates.options = body.options;
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order;
  if (typeof body.section_id === "string") updates.section_id = body.section_id;

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update(updates)
    .eq("id", id)
    .eq("person_id", personId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to update question" }, { status: 500 });
  }

  return NextResponse.json({ question: data });
}

export async function DELETE(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  const body = await request.json();
  const id = body?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("questions")
    .delete()
    .eq("id", id)
    .eq("person_id", personId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
