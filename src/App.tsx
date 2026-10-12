import React from 'react';
import { ConfigProvider } from 'antd';
import { AppRouter } from './router/AppRouter';

export const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FA5A2A',
          colorPrimaryHover: '#E44819',
          colorPrimaryActive: '#C8380E',
          colorSuccess: '#12B76A',
          colorWarning: '#F79009',
          colorError: '#F04438',
          colorInfo: '#2E90FA',
          colorTextBase: '#101828',
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
            primaryShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
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
            itemSelectedBg: '#FFF4ED',
            itemSelectedColor: '#FA5A2A',
          },
          Tabs: {
            itemColor: '#667085',
            itemHoverColor: '#101828',
            itemSelectedColor: '#FA5A2A',
            inkBarColor: '#FA5A2A',
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
