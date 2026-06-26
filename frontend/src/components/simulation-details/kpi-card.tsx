import { Statistic } from 'antd';
import styles from './style.module.css';

interface Props {
    label: string;
    value: number;
    precision?: number;
    suffix?: string;
    color: string;
    icon: React.ReactNode;
    caption?: string;
    highlight?: boolean;
}

const KpiCard = ({
    label,
    value,
    precision,
    suffix,
    color,
    icon,
    caption,
    highlight,
}: Props) => {
    return (
        <div
            className={`${styles.kpiCard} ${
                highlight
                ? styles.kpiHighlight
                : ''
            }`}
        >
        <Statistic
            title={
            <span className={styles.kpiTitle}>
                {label}
            </span>
            }
            value={value}
            precision={precision}
            suffix={suffix}
            styles={{
            content: {
                color,
            },
            }}
            prefix={
            <span
                className={styles.kpiIcon}
                style={{
                color,
                }}
            >
                {icon}
            </span>
            }
        />

        {caption && (
            <div className={styles.kpiCaption}>
            {caption}
            </div>
        )}
        </div>
    );
};

export default KpiCard;