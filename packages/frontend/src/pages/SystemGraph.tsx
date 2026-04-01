import WdogBreadClum from "@/components/WdogBreadClum";
import SystemGraphMain from "@/sections/SystemGraphMain";

export default function SystemSelect() {

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="SystemGraph"/> 
      </div>
      <div className="flex gap-4 w-full">
        <SystemGraphMain />
      </div>     
    </div>
  );
}