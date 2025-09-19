import { Menu } from "antd";
import type { MenuProps } from 'antd';
import { HomeFilled, FileExcelOutlined, FilePptOutlined, SettingOutlined,DesktopOutlined , UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import React from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';


const menuItems = [
    {
        title: "Home",
        icon: HomeFilled,
        path: "/"
    },
    {
        title: "Auto Excel",
        icon: FileExcelOutlined,
        path: "/home"
    },
    {
        title: "Auto Presentation",
        icon: FilePptOutlined,
        path: "/ppt/home"
    },
		{
			title: "Viewer",
			icon: DesktopOutlined ,
			path: "/ppt/projects",
		}

];

export function NavigationSidebar() {
    const navigate = useNavigate();
    
    const navMenu: MenuProps['items'] = menuItems.map(
        (item, index) => {
            const key = String(index + 1);
            return {
                key: `${key}`,
                icon: React.createElement(item.icon),
                label: item.title,
                onClick: () => navigate(item.path)
            };
        },
    );

    const menuStyle = {
        backgroundColor: 'transparent',
        border: "none",
        color: 'white',
    };

    return (
        <>
            <aside className="flex flex-col justify-between h-screen overflow-y-auto nav-sidbar-dark border-r rtl:border-r-0 rtl:border-l">
                <div className="px-4 py-8">
                    <Link to="/">
                        <img src="./src/assets/gea-logo.jpg" alt="GEA" className="h-12 w-auto" />
                    </Link>
                    <div className="flex flex-col justify-between flex-1 mt-6">
                        <nav className="space-y-6">
                            <Menu
                                defaultSelectedKeys={['1']}
                                items={navMenu}
                                style={menuStyle}
                                className="bg-transparent"
                            />
                        </nav>
                    </div>
                </div>

                <div className="px-4 py-6 border-t border-gray-700">
                    <div className="flex items-center gap-x-3">
                        <Avatar 
                            size={40}
                            icon={<UserOutlined />}
                            className="border-2 border-gray-600"
                        />
                        <div>
                            <h1 className="font-medium text-gray-200">User</h1>
                            <p className="text-sm text-gray-400">user@company.com</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}