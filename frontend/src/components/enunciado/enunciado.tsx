import { Collapse, Tag } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

import {
  ENUNCIADO_TITLE,
  ENUNCIADO_PARAGRAPHS,
  ENUNCIADO_OBJETIVOS,
  ENUNCIADO_PARAMS,
} from '../../constants/enunciado';
import styles from './style.module.css';

/** Hero plegable con el enunciado completo del TP, objetivos y parámetros. */
const Enunciado = () => (
  <Collapse
    className="glass-panel"
    defaultActiveKey={['enunciado']}
    items={[
      {
        key: 'enunciado',
        label: (
          <span className={styles.title}>
            <FileTextOutlined />
            Enunciado · {ENUNCIADO_TITLE}
          </span>
        ),
        children: (
          <div className={styles.body}>
            <div className={styles.prose}>
              {ENUNCIADO_PARAGRAPHS.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div>
              <div className="section-heading">Objetivos</div>
              <ul className={styles.objectives}>
                {ENUNCIADO_OBJETIVOS.map((objetivo, index) => (
                  <li key={index}>{objetivo}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="section-heading">Parámetros</div>
              <div className={styles.params}>
                {ENUNCIADO_PARAMS.map((param) => (
                  <div className={styles.param} key={param.label}>
                    <span className={styles.paramLabel}>{param.label}</span>
                    <Tag color="blue" className={styles.paramValue}>
                      {param.value}
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
    ]}
  />
);

export default Enunciado;
