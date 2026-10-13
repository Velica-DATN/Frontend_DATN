import React from 'react';
import { ConfigProvider } from 'antd';
import { AppRouter } from './router/AppRouter';

export const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#176B87',
          colorPrimaryHover: '#12566D',
          colorPrimaryActive: '#102A43',
          colorSuccess: '#12B76A',
          colorWarning: '#F79009',
          colorError: '#F04438',
          colorInfo: '#2E90FA',
          colorTextBase: '#102A43',
          colorTextSecondary: '#475467',
          colorBgLayout: '#FFFFFF',
          colorBgContainer: '#FFFFFF',
          colorBorder: '#EAECF0',
          borderRadius: 8,
          borderRadiusLG: 10,
          borderRadiusSM: 6,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 14,
        },
        components: {
          Button: {
            controlHeight: 36,
            borderRadius: 8,
            fontWeight: 500,
            primaryShadow: '0 1px 2px 0 rgba(16, 42, 67, 0.08)',
          },
          Table: {
            headerBg: '#F9FAFB',
            headerColor: '#475467',
            borderColor: '#EAECF0',
            rowHoverBg: '#F9FAFB',
            borderRadius: 10,
          },
          Card: {
            borderRadiusLG: 10,
          },
          Menu: {
            itemBorderRadius: 6,
            itemHoverBg: '#F2F4F7',
            itemSelectedBg: '#EBF4F6',
            itemSelectedColor: '#176B87',
          },
          Tabs: {
            itemColor: '#667085',
            itemHoverColor: '#102A43',
            itemSelectedColor: '#176B87',
            inkBarColor: '#176B87',
          },
          Tag: {
            borderRadiusSM: 4,
          },
        },
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
};
export default App;
