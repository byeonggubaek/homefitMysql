import WdogBreadClum from "@/components/WdogBreadClum";
import SystemSelectMain from "@/sections/SystemSelectMain";

export default function SystemSelect() {

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="SystemSelect"/> 
      </div>
      <div className="flex gap-4 w-full">
        <SystemSelectMain />
      </div>     
    </div>
  );
}