import { Card } from 'antd';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

const TraceTab = ({ children }: Props) => {
  return (
    <Card
      className="glass-panel"
      styles={{
        body: {
          padding: 20,
        },
      }}
    >
      {children}
    </Card>
  );
};

export default TraceTab;