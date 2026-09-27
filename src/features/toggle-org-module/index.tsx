import { useState } from "react";
import { useSetOrgModules, type OrgModuleState } from "@/entities/organization";
import { formatInt } from "@/shared/lib";
import { Button, Callout, Modal, ModalActions, Toggle } from "@/shared/ui";

type Props = {
  organizationId: number;
  module: OrgModuleState;
  orgName: string;
  staff: number;
  learners: number;
};

/** Module switch (PATCH ops/organizations/:id/modules/); turning a module off asks for confirmation first. */
export function OrgModuleToggle({ organizationId, module, orgName, staff, learners }: Props) {
  const [confirming, setConfirming] = useState(false);
  const setModules = useSetOrgModules(organizationId);
  const apply = (on: boolean) => setModules.mutate({ [module.code]: on }, { onSuccess: () => setConfirming(false) });

  return (
    <>
      <Toggle
        on={setModules.isPending ? !module.isEnabled : module.isEnabled}
        label={module.name}
        disabled={setModules.isPending}
        onChange={(next) => (next ? apply(true) : setConfirming(true))}
      />
      <Modal open={confirming} onClose={() => setConfirming(false)} width={500} title={`Выключить модуль «${module.name}» у ${orgName}?`}>
        <div className="text-[13px] leading-5 text-neutral-700">
          Раздел пропадёт из интерфейса организации у {formatInt(staff)} сотрудников и {formatInt(learners)} учащихся. Данные не удаляются — при обратном
          включении всё вернётся.
        </div>
        <Callout tone="danger">Перестанет работать: {module.description.toLowerCase()}.</Callout>
        {module.isLicensed && <Callout tone="warn">Модуль есть в договоре — после выключения появится расхождение с лицензией.</Callout>}
        {setModules.error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{setModules.error.message}</div>}
        <ModalActions>
          <Button size="xl" onClick={() => setConfirming(false)}>
            Оставить включённым
          </Button>
          <Button size="xl" variant="danger" disabled={setModules.isPending} onClick={() => apply(false)}>
            {setModules.isPending ? "Выключаем…" : "Выключить модуль"}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
