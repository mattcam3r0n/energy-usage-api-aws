import Egauge from './Egauge';
import { success, failure } from "./lib/response-helper";

// eslint-disable-next-line import/prefer-default-export
export const getCurrentUsage = (event, context, callback) => {
  const eg = new Egauge();
  eg.getInstantaneousData()
    .then(mapData)
    .then((data) => {
      callback(null, success(data));
    })
    .catch(((e) => callback(null, failure({ status: false }))));
//    .catch((e) => callback(e));
};

function mapData(data) {
  const excludedCategories = ['Grid', 'Solar +'];
  const filteredData = data.filter((d) => !excludedCategories.includes(d.name));
  return {
    used: filteredData.filter((d) => d.type === 'Used').map((d) => {
      d.x = d.type;
      d.y = d.kW;
      return d;
    }),
    generated: filteredData.filter((d) => d.type === 'Generated').map((d) => {
      d.x = d.type;
      d.y = d.kW;
      return d;
    }),
  };
}
