import { Tooltip } from 'antd';
import { InfoCircleOutlined} from '@ant-design/icons';
import styles from './style.module.css';

export const labelWithTip = (
  text: string,
  tip?: string,
) => {
    return (
        <span
            className={
                styles.labelWithTip
            }
        >
        {text}

        {tip && (
            <Tooltip title={tip}>
                <InfoCircleOutlined
                    className={
                    styles.infoIcon
                    }
                />
            </Tooltip>
        )}
        </span>
    );
};