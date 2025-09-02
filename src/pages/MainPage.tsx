import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Field, GrafanaTheme2 } from '@grafana/data';
import { LinkButton, useStyles2 } from '@grafana/ui';
import { prefixRoute } from '../utils/utils.routing';
import { ROUTES } from '../constants';
import { testIds } from '../components/testIds';
import '../style.js';
import { runQuery} from 'utils/clickhouse';

function PageOne() {
  const s = useStyles2(getStyles);

  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    runQuery('clickhousetest', setFields);
    console.log("ehk")
  }, [])

  return (
      <div className={`w-full h-full max-w-full max-h-full`}>
        This is page one.
        <div className={s.marginTop}>
          {fields.length > 0 && <span>{fields[0].values[0]}</span>}
          <LinkButton data-testid={testIds.pageOne.navigateToFour} href={prefixRoute(ROUTES.Four)}>
            Full-width page example
          </LinkButton>
        </div>
      </div>
  );
}

export default PageOne;

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
});
