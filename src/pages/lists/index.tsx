import { useState } from "react";
import { SEGMENTS, usePeople } from "@/entities/audience";
import { BroadcastModal } from "@/features/send-broadcast";
import { toggleIn } from "@/shared/lib";
import { Avatar, Button, CheckBox, FilterChip, Icon, Num, OrgLabel, PageHeader, Row, SearchInput, Table } from "@/shared/ui";

export function ListsPage() {
  const people = usePeople();
  const [segment, setSegment] = useState(0);
  const [selected, setSelected] = useState([0, 1, 3]);
  const [broadcast, setBroadcast] = useState(false);
  const [query, setQuery] = useState("");
  const rows = people.filter((p) => `${p.name} ${p.login}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Списки и рассылки" subtitle="выборки пользователей по всем организациям" actions={<Button>Сохранить как список</Button>} />
      <div className="grid grid-cols-4 gap-3">
        {SEGMENTS.map((g, i) => (
          <button
            key={g.name}
            onClick={() => setSegment(i)}
            className="flex flex-col gap-[5px] rounded-2xl border px-4 py-3.5 text-left"
            style={{ background: segment === i ? "#eff6ff" : "#fff", borderColor: segment === i ? "#155dfc" : "#e5e5e5" }}
          >
            <div className="font-num text-xl leading-[1.2] font-semibold">{g.n}</div>
            <div className="text-[13px] font-medium">{g.name}</div>
            <div className="text-[11px] leading-[15px] text-neutral-500">{g.desc}</div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Имя или логин" value={query} onChange={setQuery} />
        <FilterChip label="Организация" />
        <FilterChip label="Роль" />
        <FilterChip label="Подписка" />
      </div>
      <Table cols="36px minmax(200px,1fr) 160px 160px 140px 170px 110px" minWidth={960} head={["", "Пользователь", "Логин", "Организация", "Роль", "Каналы связи", "Подписка"]}>
        {rows.map((p) => {
          const on = selected.includes(p.id);
          return (
            <Row key={p.id} onClick={() => setSelected(toggleIn(selected, p.id))} className={on ? "bg-brand-50 hover:bg-brand-50" : undefined}>
              <CheckBox on={on} />
              <span className="flex items-center gap-[9px]">
                <Avatar initials={p.initials} size={26} className="text-[10px]" />
                {p.name}
              </span>
              <Num className="text-neutral-700">{p.login}</Num>
              <OrgLabel short={p.orgShort} name={p.org} className="text-xs" />
              <span className="text-xs text-neutral-500">{p.role}</span>
              <span className="text-xs text-neutral-500">{p.channels}</span>
              <span className="text-xs text-neutral-700">{p.subscription}</span>
            </Row>
          );
        })}
      </Table>
      {selected.length > 0 && (
        <div className="sticky bottom-4 flex items-center gap-3 rounded-full bg-ink py-2.5 pr-3 pl-5 text-white shadow-pop">
          <span className="text-sm font-medium">Выбрано: {selected.length}</span>
          <button onClick={() => setSelected([])} className="border-0 bg-transparent p-0 text-xs text-neutral-400">
            снять выделение
          </button>
          <div className="flex-1" />
          <Button variant="inverse" size="md">
            Добавить в список
          </Button>
          <Button variant="inverse" size="md">
            Экспорт CSV
          </Button>
          <Button variant="primary" size="md" onClick={() => setBroadcast(true)}>
            <Icon name="send" size={16} />
            Отправить рассылку
          </Button>
        </div>
      )}
      <BroadcastModal open={broadcast} onClose={() => setBroadcast(false)} recipients={selected.length} />
    </div>
  );
}
