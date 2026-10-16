import { describe, expect, it } from "vitest";
import { MAX_REPLY_DEPTH, buildCommentTree, collectDescendantIds, depthOf } from "@/lib/comment-tree";

const c = (id: number, parentId: number | null, at: string) => ({ id, parentId, createdAt: at });

describe("buildCommentTree", () => {
  it("nests replies at any depth, newest roots first and oldest replies first", () => {
    const tree = buildCommentTree([
      c(1, null, "2026-01-01"),
      c(2, null, "2026-01-05"),
      c(3, 1, "2026-01-03"),
      c(4, 1, "2026-01-02"),
      c(5, 4, "2026-01-04"),
    ]);
    expect(tree.map((n) => n.id)).toEqual([2, 1]);
    expect(tree[1].replies.map((n) => n.id)).toEqual([4, 3]);
    expect(tree[1].replies[0].replies.map((n) => n.id)).toEqual([5]);
  });

  it("drops replies whose ancestor is missing instead of showing them orphaned", () => {
    expect(buildCommentTree([c(1, null, "2026-01-01"), c(9, 8, "2026-01-02")]).map((n) => n.id)).toEqual([1]);
  });
});

describe("depthOf / collectDescendantIds", () => {
  const flat = [c(1, null, ""), c(2, 1, ""), c(3, 2, ""), c(4, 3, ""), c(5, 1, "")];

  it("counts levels below the top-level comment", () => {
    expect(depthOf(1, flat)).toBe(0);
    expect(depthOf(2, flat)).toBe(1);
    expect(depthOf(4, flat)).toBe(3);
  });

  it("stops on corrupt cyclic data instead of looping forever", () => {
    const cyclic = [c(1, 2, ""), c(2, 1, "")];
    expect(depthOf(1, cyclic)).toBeGreaterThan(MAX_REPLY_DEPTH);
  });

  it("collects the whole subtree, not siblings", () => {
    expect(collectDescendantIds(2, flat).sort()).toEqual([3, 4]);
    expect(collectDescendantIds(1, flat).sort()).toEqual([2, 3, 4, 5]);
    expect(collectDescendantIds(5, flat)).toEqual([]);
  });
});
