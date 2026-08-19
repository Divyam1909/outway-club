import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostEditorForm } from "@/components/admin/post-editor-form";
import { requireBlogEditorPage } from "@/lib/auth";
import { getAllDestinations, getAllTripsForAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Write a post" };

export default async function NewPostPage() {
  const [current, destinations, trips] = await Promise.all([
    requireBlogEditorPage(),
    getAllDestinations(),
    getAllTripsForAdmin(),
  ]);

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine"
      >
        <ArrowLeft size={15} /> Journal
      </Link>
      <h1 className="mb-7 font-display text-3xl font-semibold text-ink">Write a post</h1>

      <PostEditorForm
        destinations={destinations}
        trips={trips}
        defaultAuthorName={current.profile?.full_name ?? "Outway Club"}
      />
    </div>
  );
}
