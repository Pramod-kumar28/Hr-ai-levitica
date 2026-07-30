import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import {
  HiXMark,
  HiBars3,
  HiChevronRight,
} from "react-icons/hi2";

const DashboardLayoutBase = ({
  sidebarItems = [],
  companyLogo = "",
  logoLink = "/dashboard",
  panelTitle = "Recruiter Panel",
  panelSubtitle = "HR Management System",
  topbarLeftContent = null,
  topbarRightContent = null,
  activeTab = null,
  onTabChange = null,
  children,
}) => {
  const location = useLocation();

  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] =
    useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [openDropdowns, setOpenDropdowns] = useState({});

  const isRouteActive = (item) => {
    if (activeTab !== null && onTabChange !== null) {
      return activeTab === item.tabKey;
    }

    if (!item.to) return false;

    if (item.isParent) {
      return location.pathname.startsWith(item.to);
    }

    return location.pathname === item.to;
  };

  const isDropdownActive = (dropdownItem) => {
    if (!dropdownItem.items) return false;

    return dropdownItem.items.some((child) =>
      isRouteActive(child)
    );
  };

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  useEffect(() => {
    const initialOpenStates = {};

    sidebarItems.forEach((item) => {
      if (
        item.type === "dropdown" &&
        isDropdownActive(item)
      ) {
        initialOpenStates[item.label] = true;
      }
    });

    setOpenDropdowns(initialOpenStates);
  }, [location.pathname, sidebarItems]);

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-blue-50 overflow-x-hidden">

      <div
        onClick={closeMobileSidebar}
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300 lg:hidden

          ${mobileSidebarOpen
            ? "visible opacity-100"
            : "invisible opacity-0"
          }
        `}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          overflow-hidden
          bg-primary-900
          transition-all duration-300 ease-in-out

          ${mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }

          ${desktopSidebarCollapsed
            ? "lg:w-20"
            : "lg:w-72"
          }

          w-72
        `}
      >

        <div className="flex h-16 items-center justify-between px-4">
          <Link
            to={logoLink}
            className="flex items-center gap-3 overflow-hidden no-underline"
          >
            {companyLogo ? (
              <img
                src="/assets/images/leviticalogo.png"
                alt="Company Logo"
                className={`
                  object-contain transition-all duration-300 rounded-lg

                  ${desktopSidebarCollapsed
                    ? "h-9 w-9"
                    : "h-10 w-auto max-w-[170px]"
                  }
                `}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white shadow-lg">
                HR
              </div>
            )}

            {!desktopSidebarCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-bold tracking-wide text-white">
                  {panelTitle}
                </span>

                <span className="truncate text-xs text-primary-100">
                  {panelSubtitle}
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="rounded-xl p-2 text-primary-200 transition-all duration-200 hover:bg-primary-800 hover:text-white lg:hidden"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4">
          <div className="space-y-1">
            {sidebarItems.map((item, index) => {

              if (item.type === "title") {
                return !desktopSidebarCollapsed ? (
                  <div
                    key={`title-${index}`}
                    className="px-3 py-2 text-[18px] font-bold text-white"
                  >
                    {item.label}
                  </div>
                ) : (
                  <div
                    key={`divider-${index}`}
                    className="my-5 h-px bg-primary-800"
                  />
                );
              }

              const IconComponent = item.icon;

              if (item.type === "dropdown") {
                const isOpen =
                  openDropdowns[item.label];

                const isChildActive =
                  isDropdownActive(item);

                return (
                  <div
                    key={`dropdown-${index}`}
                    className="space-y-1"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleDropdown(item.label)
                      }
                      className={`
                        group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200

                        ${isChildActive
                          ? "bg-primary-800 text-white shadow-lg"
                          : "text-primary-200 hover:bg-primary-800 hover:text-white"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {IconComponent && (
                          <IconComponent
                            className={`
                              h-5 w-5 flex-shrink-0 transition-all duration-200

                              ${isChildActive
                                ? "text-primary-200"
                                : "text-primary-200 group-hover:text-white"
                              }
                            `}
                          />
                        )}

                        {!desktopSidebarCollapsed && (
                          <span className="truncate">
                            {item.label}
                          </span>
                        )}
                      </div>

                      {!desktopSidebarCollapsed && (
                        <HiChevronRight
                          className={`
                            h-4 w-4 flex-shrink-0 transition-all duration-300

                            ${isOpen
                              ? "rotate-90"
                              : ""
                            }
                          `}
                        />
                      )}
                    </button>

                    {!desktopSidebarCollapsed &&
                      isOpen &&
                      item.items && (
                        <div className="ml-6 mt-2 border-l border-primary-800 pl-4">
                          <div className="space-y-1">
                            {item.items.map(
                              (
                                subItem,
                                subIndex
                              ) => {
                                const isActive =
                                  isRouteActive(
                                    subItem
                                  );

                                const SubIconComponent =
                                  subItem.icon;

                                const linkProps =
                                  onTabChange
                                    ? {
                                      to: "#",

                                      onClick:
                                        (
                                          e
                                        ) => {
                                          e.preventDefault();

                                          onTabChange(
                                            subItem.tabKey
                                          );

                                          closeMobileSidebar();
                                        },
                                    }
                                    : {
                                      to: subItem.to,
                                    };

                                return (
                                  <NavLink
                                    key={`sub-${subIndex}`}
                                    {...linkProps}
                                    onClick={() =>
                                      closeMobileSidebar()
                                    }
                                    className={`
                                      group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 no-underline

                                      ${isActive
                                        ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                        : "text-primary-200 hover:bg-primary-800 hover:text-white"
                                      }
                                    `}
                                  >
                                    {SubIconComponent && (
                                      <SubIconComponent
                                        className={`
                                          h-4 w-4 flex-shrink-0

                                          ${isActive
                                            ? "text-white"
                                            : "text-primary-200 group-hover:text-white"
                                          }
                                        `}
                                      />
                                    )}

                                    <span className="truncate">
                                      {
                                        subItem.label
                                      }
                                    </span>
                                  </NavLink>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              }

              const isActive =
                isRouteActive(item);

              const linkProps =
                onTabChange && item.tabKey
                  ? {
                    to: "#",

                    onClick: (e) => {
                      e.preventDefault();

                      onTabChange(item.tabKey);

                      closeMobileSidebar();
                    },
                  }
                  : {
                    to: item.to,
                  };

              return (
                <NavLink
                  key={`link-${index}`}
                  {...linkProps}
                  onClick={() =>
                    closeMobileSidebar()
                  }
                  className={`
                    group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 no-underline

                    ${isActive
                      ? "bg-primary-600 text-white shadow-xl shadow-primary-600/20"
                      : "text-primary-200 hover:bg-primary-800 hover:text-white"
                    }
                  `}
                >
                  {IconComponent && (
                    <IconComponent
                      className={`
                        h-5 w-5 flex-shrink-0 transition-all duration-200

                        ${isActive
                          ? "text-white"
                          : "text-primary-200 group-hover:text-white"
                        }
                      `}
                    />
                  )}

                  {!desktopSidebarCollapsed && (
                    <span className="truncate">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>

      <div
        className={`
          flex h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out

          ${desktopSidebarCollapsed
            ? "lg:pl-20"
            : "lg:pl-72"
          }
        `}
      >


        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-blue-100 bg-white/90 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setDesktopSidebarCollapsed(
                  !desktopSidebarCollapsed
                )
              }
              className="hidden rounded-xl p-2 text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-primary lg:flex"
            >
              <HiBars3
                className={`
                  h-5 w-5 transition-transform duration-300

                  ${desktopSidebarCollapsed
                    ? "rotate-180"
                    : ""
                  }
                `}
              />
            </button>


            <button
              type="button"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              className="rounded-xl p-2 text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-primary lg:hidden"
            >
              <HiBars3 className="h-5 w-5" />
            </button>


            <div>{topbarLeftContent}</div>
          </div>

          <div className="flex items-center gap-4">
            {topbarRightContent}
          </div>
        </header>


        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-blue-50 p-3 scrollbar-hide">
          {children}
        </main>

        <footer className="flex h-14 items-center justify-between border-t border-blue-100 bg-white px-6 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Dashboard.
            All Rights Reserved.
          </div>

          <div className="flex items-center gap-1">
            <span>Made by</span>

            <a
              href="https://leviticatechnologies.com/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary no-underline transition-all duration-200 hover:text-primary-700"
            >
              Levitica Technologies
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayoutBase;