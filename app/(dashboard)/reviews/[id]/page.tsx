import { ReviewDetailPage } from "@/features/reviews/components/review-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewDetailPage id={id} />;
}
