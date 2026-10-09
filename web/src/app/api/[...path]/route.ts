import { dispatch } from "@/server/api/router";

export const dynamic = "force-dynamic";
type Ctx = { params: { path: string[] } };
const h = (req: Request, { params }: Ctx) => dispatch(req, params.path);
export { h as GET, h as POST, h as PUT, h as PATCH, h as DELETE };
