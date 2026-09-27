import { AnnouncementComposer } from "@/features/compose-announcement";
import { PageHeader } from "@/shared/ui";

export function AnnouncementsPage() {
  return (
    <div className="flex max-w-[1240px] flex-col gap-4">
      <PageHeader title="Анонсы" subtitle="релизы и плановые работы для учреждений" />
      <AnnouncementComposer />
    </div>
  );
}
