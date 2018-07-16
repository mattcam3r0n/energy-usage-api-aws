import Egauge from './Egauge';

const timePeriods = {
  last24hours() {
    return {
      C: null,
      m: null,
      n: 720,
      s: 1,
    };
  },
  last7days() {
    return {
      e: null,
      C: null,
      m: null,
      n: 720,
      s: 13,
    };
  },
  last30days() {
    return {
      C: null,
      m: null,
      n: 732,
      s: 60,
    };
  },
};

// eslint-disable-next-line import/prefer-default-export
export const getUsageDetail = (event, context, callback) => {
  const eg = new Egauge();

  const { period } = event.pathParameters;
  const options = timePeriods[period]();

  eg.getStoredData(options)
    .then((data) => data)
    .then(mapData)
    .then(reshapeData)
    .then((data) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(data),
      });
    })
    .catch((e) => callback(e));
};

function mapData(data) {
  // for each column, create a series object
  return {
    serial: data.serial,
    delta: data.delta,
    epoch: data.epoch,
    timeDelta: Number(data.timeDelta),
    timeStamp: Number(data.timeStamp) * 1000, // convert to ms
    columns: data.columns.map((c, i) => {
      return {
        type: c.type,
        name: c.name,
        series: data.rows.slice(1).map((r, j) => {
          // calc timestamp from starting value, multiply by 1000
          const ts = (data.timeStamp - data.timeDelta * j) * 1000;
          return {
            timeStamp: ts,
            kW: Math.abs(r.cells[i]),
          };
        }),
      };
    }),
  };
}

function reshapeData(data) {
  const excludedCategories = ['Grid', 'Solar +'];
  const generatedCategories = ['Solar '];
  const filteredData = data.columns
    .filter((d) => !excludedCategories.includes(d.name))
    .map((d) => {
      return {
        type: generatedCategories.includes(d.name) ? 'Generated' : 'Used',
        name: d.name,
        series: d.series
          .map((s) => {
            return {
              timeStamp: s.timeStamp,
              kW: s.kW / data.timeDelta,
            };
          })
          .reverse(),
      };
    });
  return {
    used: filteredData.filter((d) => d.type === 'Used'),
    generated: filteredData.filter((d) => d.type === 'Generated'),
  };
}
