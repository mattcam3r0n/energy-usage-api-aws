import fetch from "node-fetch";
import xml2json from "xml-js";

class Egauge {
  constructor(host = "egauge17632.egaug.es") {
    this.host = host;
    this.instantUri = `http://${host}/cgi-bin/egauge`;
    this.storedUri = `http://${host}/cgi-bin/egauge-show`;
  }

  getInstantaneousData() {
    const excludedCategories = ["Grid", "Solar +"];
    const generatedCategories = ["Solar "];
    return getData(this.instantUri, { inst: null })
      .then((data) => data)
      .then(transformInstantaneous)
      .then((result) => {
        return result.r
          .filter((r) => !excludedCategories.includes(r.n))
          .map((r) => {
            return {
              type: generatedCategories.includes(r.n) ? "Generated" : "Used",
              name: r.n,
              kW: Math.abs(Number(r.i)),
            };
          });
      });
  }

  getStoredData(
    options = {
      e: null,
      m: null,
      C: null,
      s: 1,
      n: 720,
    }
  ) {
    // NOTE
    // create a map of different time frame args? choose based on key?
    // eg, 1h, 12h, 1d, 1w, 1m, 6m
    return getData(this.storedUri, options)
      .then((result) => {
        return transformStored(result);
      });
  }
}

function getData(uri, options = {}) {
  const uriWithOptions = uri + buildQueryString(options);
  console.log("uriWithOptions", uriWithOptions);
  return fetch(uriWithOptions, {
    method: "GET",
    headers: {
      "Content-Type": "text/xml",
      "cache-control": "no-cache",
    },
    mode: "no-cors",
  })
    .then((response) => {
      return response.text();
    })
    .then((text) => {
      return xmlToJson(text);
    })
    .then((json) => {
      return json;
    });
}

function buildQueryString(options) {
  let qs = "?";
  Object.keys(options).forEach((k) => {
    qs += k + (options[k] !== null ? "=" + options[k] : "") + "&";
  });
  return qs.substring(0, qs.length - 1);
}

function xmlToJson(xml) {
  return xml2json.xml2js(xml, { compact: true });
}

function transformInstantaneous(json) {
  const data = {
    serial: json.data._attributes.serial,
    ts: json.data.ts._text,
    r: json.data.r.map((r) => {
      const reg = {
        t: r._attributes.t,
        n: r._attributes.n,
        v: r.v._text,
      };
      if (r.i) {
        reg.i = r.i._text;
      }
      if (r.rt) {
        reg.rt = r.rt._text;
      }
      return reg;
    }),
  };
  return Promise.resolve(data);
}

function transformStored(json) {
  if (!Array.isArray(json.group.data)) {
    json.group.data = [json.group.data];
  }
  const data = {
    serial: json.group._attributes.serial,
    epoch: json.group.data[0]._attributes.epoch,
    timeDelta: json.group.data[0]._attributes.time_delta,
    timeStamp: json.group.data[0]._attributes.time_stamp,
    columns: json.group.data[0].cname.map((c) => {
      return {
        type: c._attributes.t,
        name: c._text,
      };
    }),
    rows: json.group.data
      .map((d) => {
        if (!Array.isArray(d.r)) {
          d.r = [d.r || []];
        }
        return d.r.map((r) => {
          return {
            timeStamp: d._attributes.time_stamp,
            cells: r.c.map((v) => Number(v._text)),
          };
        });
      })
      .reduce((a, c) => {
        return a.concat(c);
      }, []),
  };
  return Promise.resolve(data);
}

export default Egauge;
