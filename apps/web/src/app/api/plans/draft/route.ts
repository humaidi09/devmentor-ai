import type { NextRequest } from "next/server";
import {
  account,
  dbResult,
  failure,
  json,
  storageConsent,
} from "@/lib/server-api";
import {
  object,
  exact,
  text,
  id,
  uuid,
  bool,
  ApiError,
} from "@/lib/validation";
export async function POST(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const b = object(await req.json());
    exact(b, ["title", "resourceId", "steps", "token", "confirmed"]);
    if (!Array.isArray(b.steps) || b.steps.length < 1 || b.steps.length > 6)
      throw new ApiError(400, "Invalid steps.");
    await storageConsent(db, user.id);
    return json(
      {
        id: dbResult(
          await db.rpc("save_close_ai_draft", {
            title: text(b.title),
            resource: id(b.resourceId),
            steps: b.steps.map((s) => text(s)),
            token: uuid(b.token),
            confirmed: bool(b.confirmed),
          }),
        ),
      },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
