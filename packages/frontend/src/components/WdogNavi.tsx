import * as React from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import type { NavItem } from 'shared';
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface WdogNaviProps {
  navItems: NavItem[];
}

export default function WdogNavi({ navItems }: WdogNaviProps) {
// 1. 여기서 단 한 번만 선언합니다.
  const navigate = useNavigate();

  // 2. 이동을 담당할 공통 핸들러 (선택 사항)
  const handleNavigate = (path: string) => {
    navigate(path);
  };  
  return (
    <div className="flex justify-center self-start pt-6 w-full">
      <NavigationMenu>
        <NavigationMenuList>
          {navItems.map(nav => (
            <NavigationMenuItem key={nav.NAV_ID}>
              <NavigationMenuTrigger className={`
                text-xl 
                transition-colors
                ${navigationMenuTriggerStyle()}
              `}>
                {nav.NAV_NAME}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-100 gap-3 p-1 md:w-125 md:grid-cols-2 lg:w-150 list-none">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex gap-2 h-full w-full select-none flex-col justify-start rounded-md bg-linear-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="#"
                        onClick={e => e.preventDefault()}
                      >
                        <img src={nav.NAV_IMG} alt={nav.NAV_NAME} width={300} height={400}  />
                        <p className="text-primary text-sm leading-tight">
                          {nav.NAV_DESC}
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  {nav.NAV_SUB_MENUS.map(sub => (
                    <ListItem 
                      key={sub.NAS_ID} 
                      title={sub.NAS_NAME} 
                      // 3. 부모에서 정의한 navigate 로직을 props로 전달하거나 경로만 전달합니다.
                      onClick={() => handleNavigate(sub.NAS_HREF)}
                    >
                      {sub.NAS_DESC}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const ListItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div"> & { title: string }>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <div
            ref={ref}
            role="button"
            tabIndex={0}
            className={cn(
              "block cursor-pointer select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props} // 부모로부터 받은 onClick이 여기로 주입됩니다.
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                props.onClick?.(e as any);
              }
            }}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </div>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = "ListItem"
