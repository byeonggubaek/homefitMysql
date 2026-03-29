import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react"

import type { MenuPos } from "shared";
import { Link } from "react-router-dom";

interface WgodBreadcrumbProps {
  page : string
}
const WgodBreadcrumb = (
{ 
  page
}: WgodBreadcrumbProps) => 
{
  const [menuPos, setMenuPos] = useState<MenuPos>();
  useEffect(() => {
    fetch(`http://localhost:3001/api/getMenuPos?page=${page}`)
      .then(res => res.json())
      .then(data => {
        setMenuPos(data.data);
      });
  }, [page]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">홈</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage >{menuPos?.NAV_NAME}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-focus">
                  {menuPos?.NAS_NAME}
                  <ChevronDownIcon className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  {menuPos?.NAS_SIBLINGS.map((sib) => (
                    <DropdownMenuItem key={sib.NAS_ID}>
                      {sib.NAS_ID === menuPos.NAS_ID ? <span className="text-focus"><Link to={sib.NAS_HREF}>{sib.NAS_NAME}</Link></span> : <Link to={sib.NAS_HREF}>{sib.NAS_NAME}</Link>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>    
    </>
  )
};

export default WgodBreadcrumb;