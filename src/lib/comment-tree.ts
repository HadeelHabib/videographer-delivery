export const MAX_REPLY_DEPTH = 5; // top-level comment = depth 0

type Flat = { id: number; parentId: number | null; createdAt: Date | string };
export type CommentNode<T extends Flat> = T & { replies: CommentNode<T>[] };

const time = (d: Date | string) => new Date(d).getTime();

// Newest top-level comments first; replies oldest-first so a thread reads top to bottom.
// Replies whose ancestor isn't in the input are dropped rather than shown orphaned.
export function buildCommentTree<T extends Flat>(flat: T[]): CommentNode<T>[] {
  const nodes = new Map<number, CommentNode<T>>();
  for (const c of flat) nodes.set(c.id, { ...c, replies: [] });

  const roots: CommentNode<T>[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === null) roots.push(node);
    else nodes.get(node.parentId)?.replies.push(node);
  }

  const sortReplies = (list: CommentNode<T>[]) => {
    list.sort((a, b) => time(a.createdAt) - time(b.createdAt));
    list.forEach((n) => sortReplies(n.replies));
  };
  roots.forEach((r) => sortReplies(r.replies));
  return roots.sort((a, b) => time(b.createdAt) - time(a.createdAt));
}

export function depthOf(id: number, flat: { id: number; parentId: number | null }[]) {
  const parents = new Map(flat.map((c) => [c.id, c.parentId]));
  let depth = 0;
  let cursor = parents.get(id) ?? null;
  while (cursor !== null && depth <= MAX_REPLY_DEPTH + 1) {
    depth += 1;
    cursor = parents.get(cursor) ?? null;
  }
  return depth;
}

export function collectDescendantIds(id: number, flat: { id: number; parentId: number | null }[]) {
  const children = new Map<number, number[]>();
  for (const c of flat) {
    if (c.parentId === null) continue;
    children.set(c.parentId, [...(children.get(c.parentId) ?? []), c.id]);
  }
  const out: number[] = [];
  const stack = [id];
  while (stack.length) {
    const next = children.get(stack.pop()!) ?? [];
    out.push(...next);
    stack.push(...next);
  }
  return out;
}
