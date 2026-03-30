import WdogBreadClum from "@/components/WdogBreadClum";
import SystemInsertMain from "@/sections/SystemInsertMain";

export default function SystemInsert() {

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="SystemInsert"/> 
      </div>
      <div className="flex gap-4 w-full">
        <SystemInsertMain />
      </div>     
    </div>
  );
}