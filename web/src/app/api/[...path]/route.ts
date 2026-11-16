import { dispatch } from "@/server/api/router";

export const dynamic = "force-dynamic";
// Next 15 : les paramètres de la route arrivent sous forme de promesse.
type Ctx = { params: Promise<{ path: string[] }> };
const h = async (req: Request, { params }: Ctx) => dispatch(req, (await params).path);
export { h as GET, h as POST, h as PUT, h as PATCH, h as DELETE };
