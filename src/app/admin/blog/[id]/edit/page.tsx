import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostEditorForm } from "@/components/admin/post-editor-form";
import { requireBlogEditorPage } from "@/lib/auth";
import { getPostByIdForAdmin } from "@/lib/blog";
import { getAllDestinations, getAllTripsForAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [current, post, destinations, trips] = await Promise.all([
    requireBlogEditorPage(),
    getPostByIdForAdmin(id),
    getAllDestinations(),
    getAllTripsForAdmin(),
  ]);

  if (!post) notFound();

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine"
      >
        <ArrowLeft size={15} /> Journal
      </Link>
      <h1 className="mb-7 font-display text-3xl font-semibold text-ink">Edit post</h1>

      <PostEditorForm
        post={post}
        destinations={destinations}
        trips={trips}
        defaultAuthorName={current.profile?.full_name ?? "Outway Club"}
      />
    </div>
  );
}
