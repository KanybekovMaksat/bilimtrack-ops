import { useState } from "react";
import type { OrgModule } from "@/entities/organization";
import { Button, Callout, Modal, ModalActions, Toggle } from "@/shared/ui";

type Props = {
  module: OrgModule;
  orgName: string;
  staff: string;
  students: string;
  onChange: (on: boolean) => void;
};

/** Module switch; turning a module off asks for confirmation first. */
export function OrgModuleToggle({ module, orgName, staff, students, onChange }: Props) {
  const [confirming, setConfirming] = useState(false);
  const features = module.features.map((f) => f.name.toLowerCase()).join(", ");

  return (
    <>
      <Toggle
        on={module.on}
        label={module.name}
        onChange={(next) => (next ? onChange(true) : setConfirming(true))}
      />
      <Modal open={confirming} onClose={() => setConfirming(false)} width={500} title={`Выключить модуль «${module.name}» у ${orgName}?`}>
        <div className="text-[13px] leading-5 text-neutral-700">
          Раздел пропадёт из интерфейса организации у всех {staff} сотрудников и {students} учащихся сразу после сохранения. Данные не удаляются — при обратном включении всё вернётся.
        </div>
        <Callout tone="danger">Вместе с модулем перестанут работать его функции: {features}.</Callout>
        <ModalActions>
          <Button size="xl" onClick={() => setConfirming(false)}>
            Оставить включённым
          </Button>
          <Button
            size="xl"
            variant="danger"
            onClick={() => {
              onChange(false);
              setConfirming(false);
            }}
          >
            Выключить модуль
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
