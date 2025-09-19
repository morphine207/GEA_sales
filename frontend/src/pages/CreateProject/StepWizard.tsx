import { Layout, Button, Steps, Tooltip } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Tab } from "../../models";
import { RoutesConst } from "../../consts/route.const";
import { useFileStore } from "../../store/file.store";
import { ToastContainer } from "react-toastify";

enum StepFormTabs {
    UPLOAD = 'UPLOAD',
    DRAW = 'DRAW',
    SELECT = 'SELECT',
    REVIEW = 'REVIEW',
    EXPORT = 'EXPORT'
}

export const StepForm = () => {

    const location = useLocation();
    const navigate = useNavigate();
    
    const [ tabSelectedIndex, setTabSelectedIndex ] = useState<number>(0);
    const { loading, project, tableDataValidated, tableColumnsSelected, clearData: clearFileStoreData } = useFileStore()

    const routeTabs: Tab[] = [
        { 
            name: StepFormTabs.UPLOAD, 
            title: "Upload", 
            route: RoutesConst.CREATE_UPLOAD,
            rules: () => (!!project && Object.keys(project.files).length > 0)
        },
        { 
            name: StepFormTabs.DRAW, 
            title: "Draw", 
            route: RoutesConst.CREATE_DOCUMENT_REVIEW,
            rules: () => (!!project && project.files.some(file => file.scanned_files.some(sf => sf.file_regions.length > 0)))
        },
        
        { 
            name: StepFormTabs.REVIEW, 
            title: "Review", 
            route: RoutesConst.CREATE_REVIEW,
            rules: () => (!!project?.metatable && tableDataValidated)
        },
        { 
            name: StepFormTabs.SELECT, 
            title: "Selection", 
            route: RoutesConst.CREATE_SELECT,
            rules: () => (!!project?.metatable && tableColumnsSelected)
        },
        { 
            name: StepFormTabs.EXPORT, 
            title: "Export", 
            selected: false,
            route: RoutesConst.CREATE_EXPORT
        }
    ]

    {/* Added Tooltips for the Next Button */}

    const getTooltipMessage = (tabIndex: number) => {
        if (loading || (routeTabs[tabIndex].rules && !routeTabs[tabIndex]?.rules())) {
            switch (routeTabs[tabIndex].name) {
                case StepFormTabs.UPLOAD:
                    return "Please upload a file to proceed";
                case StepFormTabs.REVIEW:
                    return "Please review and save any changes to proceed";
                case StepFormTabs.SELECT:
                    return "Please select and save your column choices before proceeding";
                default:
                    return "";
            }
        }
        return "";
    };

    useEffect(() => {
        navigate(routeTabs[tabSelectedIndex].route, { replace: true });

        return () => {
            clearFileStoreData()
        }
    }, []);

    useEffect(() => {
        const index = routeTabs.findIndex(r => r.route === location.pathname);
        if(index !== -1) {
            setTabSelectedIndex(index);
        }
    }, [location.pathname]);

    const setNextRoute = () => {
        const newIndex = tabSelectedIndex + 1;
        if(routeTabs[newIndex])
           return navigate(routeTabs[newIndex].route);

        return navigate('/')
    }
    
    return (
        <>
            <Layout
                style={{
                    background: "#fff"
                }}
            >
                <div className="px-4 mt-3 max-w-7xl mx-auto w-full flex flex-col">
                    <div className="my-2 flex justify-center items-center">
                        <Steps
                            current={tabSelectedIndex}
                            items={
                                routeTabs.map((tab) => ({
                                    title: tab.name   
                                }))
                            }
                            className="w-1/2"
                        />
                    </div>

                    <div className="form-title">
                        <h1 className="text-xl pb-1 border-b-2 border-solid">
                            {routeTabs[tabSelectedIndex].title}
                        </h1>
                    </div>

                    <div 
                        className="mt-6 flex-1"
                    >     
                        <Outlet />
                    </div>
                    <div className="flex justify-end mt-16">
                        {/* Added Tooltip */}
                        <Tooltip title={getTooltipMessage(tabSelectedIndex)} placement="top">
                            <div>
                                <Button
                                    size="large"
                                    className="w-32 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-[#0026B7] text-white font-medium py-3 px-6 rounded-lg flex items-center text-lg shadow-md transition-all duration-200"
                                    onClick={() => setNextRoute()}
                                    disabled={loading || (routeTabs[tabSelectedIndex].rules && !routeTabs[tabSelectedIndex]?.rules())}
                                >
                                    {
                                        tabSelectedIndex === routeTabs.length - 1 ? <span>Finalize</span> : <span>Next</span>
                                    }
                                </Button>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </Layout>
            <ToastContainer />
        </>
    );
}