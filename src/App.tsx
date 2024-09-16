import React from 'react';
import {useRoutes} from 'react-router-dom';
import Tab from '@/view/Tab';
import routes from '@/router';
import '@/styles/index.less';

function App() {
    // 通过useRoutes配置实现路由管理
    const element = useRoutes(routes);
    const newBranch2 = () => {};
    const newBranch1 = () => {};

    return (
        <div className='app'>
            <Tab />
            <div onClick={newBranch1}>Click Me</div>
            <div onClick={newBranch1}>Click Me</div>
            <div onClick={newBranch1}>Click Me</div>
            <div onClick={newBranch1}>Click Me</div>
            <div onClick={newBranch2}>Click Me</div>
            {element}
        </div>
    );
}

export default App;
